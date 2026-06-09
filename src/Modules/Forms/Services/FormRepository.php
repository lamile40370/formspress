<?php

namespace FlowForms\Modules\Forms\Services;

class FormRepository {

	private string $table;

	public function __construct() {
		global $wpdb;
		$this->table = $wpdb->prefix . 'ff_forms';
	}

	public function get_all( array $args = [] ): array {
		global $wpdb;

		$page     = max( 1, (int) ( $args['page'] ?? 1 ) );
		$per_page = min( 100, max( 1, (int) ( $args['per_page'] ?? 20 ) ) );
		$offset   = ( $page - 1 ) * $per_page;
		$search   = sanitize_text_field( $args['search'] ?? '' );
		$statuses = $this->sanitize_list( $args['status'] ?? '', [ 'active', 'inactive', 'draft', 'trash' ] );
		$types    = $this->sanitize_list( $args['type'] ?? '', [ 'standard', 'flow' ] );
		$sort     = in_array( $args['sort'] ?? '', [ 'title', 'status', 'type', 'created_at', 'updated_at' ], true ) ? $args['sort'] : 'created_at';
		$order    = strtoupper( $args['order'] ?? 'DESC' ) === 'ASC' ? 'ASC' : 'DESC';

		$where  = '1=1';
		$params = [];

		if ( $statuses ) {
			$this->append_in_condition( $where, $params, 'status', $statuses );
		} else {
			$where .= " AND status != 'trash'";
		}

		if ( $search !== '' ) {
			$where   .= ' AND title LIKE %s';
			$params[] = '%' . $wpdb->esc_like( $search ) . '%';
		}

		if ( $types ) {
			$this->append_in_condition( $where, $params, 'type', $types );
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$total_query = "SELECT COUNT(*) FROM {$this->table} WHERE {$where}";
		$total       = $params
			? (int) $wpdb->get_var( $wpdb->prepare( $total_query, ...$params ) ) // phpcs:ignore
			: (int) $wpdb->get_var( $total_query ); // phpcs:ignore

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$data_query  = "SELECT id, title, description, type, status, created_at, updated_at FROM {$this->table} WHERE {$where} ORDER BY {$sort} {$order} LIMIT %d OFFSET %d";
		$data_params = array_merge( $params, [ $per_page, $offset ] );
		$forms       = $wpdb->get_results( $wpdb->prepare( $data_query, ...$data_params ), ARRAY_A ); // phpcs:ignore

		foreach ( $forms as &$form ) {
			$form['entries_count'] = $this->get_entries_count( (int) $form['id'] );
		}

		return [
			'items'       => $forms ?: [],
			'total'       => $total,
			'page'        => $page,
			'per_page'    => $per_page,
			'total_pages' => (int) ceil( $total / $per_page ),
		];
	}

	public function get( int $id ): ?array {
		global $wpdb;

		$form = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$this->table} WHERE id = %d", $id ), // phpcs:ignore
			ARRAY_A
		);

		if ( ! $form ) {
			return null;
		}

		// `fields` stays the schema array (every downstream consumer —
		// EntryProcessor, BindingProcessor, FormRenderer, ExportEntries —
		// depends on that shape). For forms saved as block markup we also
		// surface the raw markup at `fields_markup` so the Gutenberg builder
		// can call `parse(markup)` and keep block-level fidelity.
		$raw_fields = (string) ( $form['fields'] ?? '' );
		if ( FieldsParser::is_markup( $raw_fields ) ) {
			$form['fields']        = FieldsParser::to_schema( $raw_fields );
			$form['fields_markup'] = $raw_fields;
			$form['is_markup']     = true;
		} else {
			$decoded               = json_decode( $raw_fields ?: '[]', true );
			$form['fields']        = is_array( $decoded ) ? $decoded : [];
			$form['fields_markup'] = null;
			$form['is_markup']     = false;
		}

		$form['settings'] = json_decode( $form['settings'] ?? '{}', true ) ?: [];
		$form['actions']  = json_decode( $form['actions'] ?? '[]', true ) ?: [];
		$form['variants'] = json_decode( $form['variants'] ?? '[]', true ) ?: [];

		$form['entries_count'] = $this->get_entries_count( $id );

		return $form;
	}

	public function create( array $data ): int|false {
		global $wpdb;

		// Same dual-path as `update()`: when the caller flags
		// `fields_markup: true` and `fields` is a string of Gutenberg
		// block-comment markup, persist it verbatim. Otherwise treat
		// `fields` as a legacy schema array and JSON-encode it.
		$raw_fields = $data['fields'] ?? [];
		$fields_col = ( ! empty( $data['fields_markup'] ) && is_string( $raw_fields ) )
			? $raw_fields
			: wp_json_encode( $raw_fields );
		$status     = $data['status'] ?? 'active';
		$status     = in_array( $status, [ 'active', 'inactive', 'draft' ], true ) ? $status : 'active';

		$row = [
			'title'       => sanitize_text_field( $data['title'] ?? __( 'Untitled Form', 'formspress' ) ),
			'description' => sanitize_textarea_field( $data['description'] ?? '' ),
			'type'        => in_array( $data['type'] ?? 'standard', [ 'standard', 'flow' ], true ) ? $data['type'] : 'standard',
			'fields'      => $fields_col,
			'settings'    => wp_json_encode( $data['settings'] ?? $this->default_settings() ),
			'actions'     => wp_json_encode( $data['actions'] ?? [] ),
			'status'      => $status,
		];
		$formats = [ '%s', '%s', '%s', '%s', '%s', '%s', '%s' ];

		if ( isset( $data['variants'] ) && $this->column_exists( 'variants' ) ) {
			$row['variants'] = wp_json_encode( is_array( $data['variants'] ) ? $data['variants'] : [] );
			$formats[]       = '%s';
		}

		$result = $wpdb->insert( $this->table, $row, $formats );

		if ( $result && $wpdb->insert_id ) {
			/**
			 * Fires after a form is created. Compat providers hook here to
			 * register translatable strings.
			 *
			 * @param int $form_id Newly created form ID.
			 */
			do_action( 'flowforms_form_saved', (int) $wpdb->insert_id );
			return (int) $wpdb->insert_id;
		}

		return false;
	}

	public function update( int $id, array $data ): bool {
		global $wpdb;

		$update = [];
		$format = [];

		if ( isset( $data['title'] ) ) {
			$update['title']  = sanitize_text_field( $data['title'] );
			$format[]         = '%s';
		}

		if ( isset( $data['description'] ) ) {
			$update['description'] = sanitize_textarea_field( $data['description'] );
			$format[]              = '%s';
		}

		if ( isset( $data['type'] ) && in_array( $data['type'], [ 'standard', 'flow' ], true ) ) {
			$update['type'] = $data['type'];
			$format[]       = '%s';
		}

		if ( isset( $data['fields'] ) ) {
			// New (Gutenberg-iso) builder sends block markup as a string
			// + `fields_markup: true`. Legacy builder sends a JSON-encodable
			// array. We persist each in its native shape — the renderer
			// detects which is which based on the leading byte.
			if ( ! empty( $data['fields_markup'] ) && is_string( $data['fields'] ) ) {
				$update['fields'] = $data['fields'];
			} else {
				$update['fields'] = wp_json_encode( $data['fields'] );
			}
			$format[] = '%s';
		}

		if ( isset( $data['settings'] ) ) {
			$update['settings'] = wp_json_encode( $data['settings'] );
			$format[]           = '%s';
		}

		if ( isset( $data['actions'] ) ) {
			$update['actions'] = wp_json_encode( $data['actions'] );
			$format[]          = '%s';
		}

		if ( isset( $data['variants'] ) && $this->column_exists( 'variants' ) ) {
			$update['variants'] = wp_json_encode( is_array( $data['variants'] ) ? $data['variants'] : [] );
			$format[]           = '%s';
		}

		if ( isset( $data['status'] ) && in_array( $data['status'], [ 'active', 'inactive', 'draft' ], true ) ) {
			$update['status'] = $data['status'];
			$format[]         = '%s';
		}

		if ( empty( $update ) ) {
			return false;
		}

		$update['updated_at'] = current_time( 'mysql' );
		$format[]             = '%s';

		$result = $wpdb->update( $this->table, $update, [ 'id' => $id ], $format, [ '%d' ] );

		if ( false !== $result ) {
			/** @see create() — same hook, fires for both insert and update. */
			do_action( 'flowforms_form_saved', $id );
		}

		return false !== $result;
	}

	public function delete( int $id ): bool {
		global $wpdb;

		$result = $wpdb->update(
			$this->table,
			[ 'status' => 'trash' ],
			[ 'id' => $id ],
			[ '%s' ],
			[ '%d' ]
		);

		return false !== $result;
	}

	public function duplicate( int $id ): int|false {
		$original = $this->get( $id );

		if ( ! $original ) {
			return false;
		}

		return $this->create( [
			'title'       => sprintf( __( '%s (Copy)', 'formspress' ), $original['title'] ),
			'description' => $original['description'],
			'type'        => $original['type'],
			'fields'      => $original['fields'],
			'settings'    => $original['settings'],
			'actions'     => $original['actions'],
			'variants'    => $original['variants'] ?? [],
		] );
	}

	private function column_exists( string $column ): bool {
		global $wpdb;
		static $cache = [];

		$key = $this->table . '.' . $column;
		if ( isset( $cache[ $key ] ) ) {
			return $cache[ $key ];
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$result = $wpdb->get_results( "SHOW COLUMNS FROM {$this->table} LIKE '" . esc_sql( $column ) . "'" );
		return $cache[ $key ] = ! empty( $result );
	}

	private function get_entries_count( int $form_id ): int {
		global $wpdb;
		$entries_table = $wpdb->prefix . 'ff_entries';
		return (int) $wpdb->get_var( // phpcs:ignore
			$wpdb->prepare( "SELECT COUNT(*) FROM {$entries_table} WHERE form_id = %d AND status != 'trash'", $form_id )
		);
	}

	private function sanitize_list( mixed $value, array $allowed ): array {
		$raw = is_array( $value ) ? $value : explode( ',', (string) $value );
		$sanitized = array_map(
			static fn( $item ) => sanitize_text_field( (string) $item ),
			$raw
		);
		$sanitized = array_filter( array_unique( $sanitized ) );

		return array_values( array_intersect( $sanitized, $allowed ) );
	}

	private function append_in_condition( string &$where, array &$params, string $column, array $values ): void {
		$placeholders = implode( ', ', array_fill( 0, count( $values ), '%s' ) );
		$where .= " AND {$column} IN ({$placeholders})";
		array_push( $params, ...$values );
	}

	public function default_settings(): array {
		$global         = get_option( 'flowforms_settings', [] );
		$success_action = $global['default_success_action'] ?? 'message';
		$success_action = in_array( $success_action, [ 'message', 'redirect' ], true ) ? $success_action : 'message';

		return [
			'submit_label'              => $this->setting_text( $global, 'default_submit_label', __( 'Submit', 'formspress' ) ),
			'success_message'           => $this->setting_textarea( $global, 'default_success_message', __( 'Thank you! Your submission has been received.', 'formspress' ) ),
			'success_action'            => $success_action,
			'redirect_url'              => $this->setting_url( $global, 'default_redirect_url' ),
			'honeypot'                  => true,
			'show_title'                => false,
			'show_description'          => false,
			'layout'                    => 'stacked',
			'prev_label'                => $this->setting_text( $global, 'default_prev_label', __( 'Back', 'formspress' ) ),
			'next_label'                => $this->setting_text( $global, 'default_next_label', __( 'Next', 'formspress' ) ),
		];
	}

	private function setting_text( array $settings, string $key, string $fallback ): string {
		$value = isset( $settings[ $key ] ) ? trim( (string) $settings[ $key ] ) : '';
		return '' === $value ? $fallback : sanitize_text_field( $value );
	}

	private function setting_textarea( array $settings, string $key, string $fallback ): string {
		$value = isset( $settings[ $key ] ) ? trim( (string) $settings[ $key ] ) : '';
		return '' === $value ? $fallback : sanitize_textarea_field( $value );
	}

	private function setting_url( array $settings, string $key ): string {
		$value = isset( $settings[ $key ] ) ? trim( (string) $settings[ $key ] ) : '';
		return '' === $value ? '' : esc_url_raw( $value );
	}
}
