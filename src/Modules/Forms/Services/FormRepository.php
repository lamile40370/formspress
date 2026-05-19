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
		$status   = sanitize_text_field( $args['status'] ?? '' );
		$type     = sanitize_text_field( $args['type'] ?? '' );
		$sort     = in_array( $args['sort'] ?? '', [ 'title', 'status', 'type', 'created_at', 'updated_at' ], true ) ? $args['sort'] : 'created_at';
		$order    = strtoupper( $args['order'] ?? 'DESC' ) === 'ASC' ? 'ASC' : 'DESC';

		// Default hides trashed forms; explicit `status=trash` flips it
		// to show ONLY trashed (so the listing's Status filter works
		// regardless of the user's selection — Active / Inactive / Draft / Trash).
		$where  = 'trash' === $status ? "status = 'trash'" : "status != 'trash'";
		$params = [];

		if ( $search !== '' ) {
			$where   .= ' AND title LIKE %s';
			$params[] = '%' . $wpdb->esc_like( $search ) . '%';
		}

		if ( $status !== '' && 'trash' !== $status ) {
			$where   .= ' AND status = %s';
			$params[] = $status;
		}

		if ( $type !== '' ) {
			$where   .= ' AND type = %s';
			$params[] = $type;
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

		$result = $wpdb->insert(
			$this->table,
			[
				'title'       => sanitize_text_field( $data['title'] ?? __( 'Untitled Form', 'flowforms' ) ),
				'description' => sanitize_textarea_field( $data['description'] ?? '' ),
				'type'        => in_array( $data['type'] ?? 'standard', [ 'standard', 'flow' ], true ) ? $data['type'] : 'standard',
				'fields'      => $fields_col,
				'settings'    => wp_json_encode( $data['settings'] ?? $this->default_settings() ),
				'actions'     => wp_json_encode( $data['actions'] ?? [] ),
				'status'      => $status,
			],
			[ '%s', '%s', '%s', '%s', '%s', '%s', '%s' ]
		);

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
			'title'       => sprintf( __( '%s (Copy)', 'flowforms' ), $original['title'] ),
			'description' => $original['description'],
			'type'        => $original['type'],
			'fields'      => $original['fields'],
			'settings'    => $original['settings'],
			'actions'     => $original['actions'],
		] );
	}

	private function get_entries_count( int $form_id ): int {
		global $wpdb;
		$entries_table = $wpdb->prefix . 'ff_entries';
		return (int) $wpdb->get_var( // phpcs:ignore
			$wpdb->prepare( "SELECT COUNT(*) FROM {$entries_table} WHERE form_id = %d AND status != 'trash'", $form_id )
		);
	}

	public function default_settings(): array {
		return [
			'submit_label'    => __( 'Submit', 'flowforms' ),
			'success_message' => __( 'Thank you! Your submission has been received.', 'flowforms' ),
			'success_action'  => 'message',
			'redirect_url'    => '',
			'honeypot'        => true,
			'show_title'      => false,
			'show_description' => false,
			'layout'          => 'stacked',
		];
	}
}
