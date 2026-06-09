<?php

namespace FlowForms\Modules\Entries\Services;

class EntryRepository {

	private string $table;
	private string $values_table;
	private string $meta_table;

	public function __construct() {
		global $wpdb;
		$this->table        = $wpdb->prefix . 'ff_entries';
		$this->values_table = $wpdb->prefix . 'ff_entry_values';
		$this->meta_table   = $wpdb->prefix . 'ff_entry_meta';
	}

	public function get_all( int $form_id = 0, array $args = [] ): array {
		global $wpdb;

		$page     = max( 1, (int) ( $args['page'] ?? 1 ) );
		$per_page = min( 100, max( 1, (int) ( $args['per_page'] ?? 20 ) ) );
		$offset   = ( $page - 1 ) * $per_page;
		$form_ids = $this->sanitize_int_list( $args['form_id'] ?? $form_id );
		$statuses = $this->sanitize_list( $args['status'] ?? '', [ 'unread', 'read', 'starred', 'spam' ] );
		$search   = sanitize_text_field( $args['search'] ?? '' );
		$sort     = in_array( $args['sort'] ?? '', [ 'id', 'form_title', 'created_at', 'status' ], true ) ? $args['sort'] : 'created_at';
		$order    = strtoupper( $args['order'] ?? 'DESC' ) === 'ASC' ? 'ASC' : 'DESC';
		$forms_table = $wpdb->prefix . 'ff_forms';

		$where    = "e.status != 'trash'";
		$params   = [];

		if ( $form_ids ) {
			$this->append_in_condition( $where, $params, 'e.form_id', $form_ids, '%d' );
		}

		if ( $statuses ) {
			$this->append_in_condition( $where, $params, 'e.status', $statuses );
		}

		if ( $search !== '' ) {
			$like = '%' . $wpdb->esc_like( $search ) . '%';
			$where .= ' AND (CAST(e.id AS CHAR) LIKE %s OR e.ip_address LIKE %s OR e.source_url LIKE %s OR f.title LIKE %s)';
			array_push( $params, $like, $like, $like, $like );
		}

		$order_by = match ( $sort ) {
			'id'         => 'e.id',
			'form_title' => 'f.title',
			'status'     => 'e.status',
			default      => 'e.created_at',
		};

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$total_query = "SELECT COUNT(*) FROM {$this->table} e LEFT JOIN {$forms_table} f ON f.id = e.form_id WHERE {$where}";
		$total       = $params
			? (int) $wpdb->get_var( $wpdb->prepare( $total_query, ...$params ) ) // phpcs:ignore
			: (int) $wpdb->get_var( $total_query ); // phpcs:ignore

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$data_query  = "SELECT e.*, f.title AS form_title FROM {$this->table} e LEFT JOIN {$forms_table} f ON f.id = e.form_id WHERE {$where} ORDER BY {$order_by} {$order} LIMIT %d OFFSET %d";
		$data_params = array_merge( $params, [ $per_page, $offset ] );
		$entries     = $wpdb->get_results( $wpdb->prepare( $data_query, ...$data_params ), ARRAY_A ); // phpcs:ignore

		return [
			'items'       => $entries ?: [],
			'total'       => $total,
			'page'        => $page,
			'per_page'    => $per_page,
			'total_pages' => (int) ceil( $total / $per_page ),
		];
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

	private function sanitize_int_list( mixed $value ): array {
		$raw = is_array( $value ) ? $value : explode( ',', (string) $value );
		$ids = array_map( 'absint', $raw );
		$ids = array_filter( array_unique( $ids ) );

		return array_values( $ids );
	}

	private function append_in_condition( string &$where, array &$params, string $column, array $values, string $placeholder = '%s' ): void {
		$placeholders = implode( ', ', array_fill( 0, count( $values ), $placeholder ) );
		$where .= " AND {$column} IN ({$placeholders})";
		array_push( $params, ...$values );
	}

	public function get( int $id ): ?array {
		global $wpdb;

		$entry = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$this->table} WHERE id = %d", $id ), // phpcs:ignore
			ARRAY_A
		);

		if ( ! $entry ) {
			return null;
		}

		$entry['values'] = $wpdb->get_results( // phpcs:ignore
			$wpdb->prepare( "SELECT * FROM {$this->values_table} WHERE entry_id = %d ORDER BY id ASC", $id ),
			ARRAY_A
		) ?: [];

		$entry['meta'] = $this->get_meta_all( $id );

		/* Surface common per-entry markers at the top level so callers
		 * (e.g. EntryProcessor) can read them without juggling meta keys. */
		$entry['redirect_url'] = $entry['meta']['redirect_url'] ?? '';

		return $entry;
	}

	/**
	 * @param array<string,mixed>|null $quiz_result {score, max_score, result_screen:{id,…}}
	 */
	public function create( int $form_id, array $values, array $meta = [], ?array $quiz_result = null ): int|false {
		global $wpdb;

		$row = [
			'form_id'    => $form_id,
			'status'     => 'unread',
			'ip_address' => sanitize_text_field( $meta['ip_address'] ?? '' ),
			'user_agent' => sanitize_text_field( $meta['user_agent'] ?? '' ),
			'user_id'    => (int) ( $meta['user_id'] ?? 0 ) ?: null,
			'source_url' => esc_url_raw( $meta['source_url'] ?? '' ),
		];
		$format = [ '%d', '%s', '%s', '%s', '%d', '%s' ];

		if ( null !== $quiz_result && $this->column_exists( 'score' ) ) {
			$row['score']            = (float) $quiz_result['score'];
			$row['result_screen_id'] = (string) ( $quiz_result['result_screen']['id'] ?? '' );
			$format[]                = '%f';
			$format[]                = '%s';
		}

		$result = $wpdb->insert( $this->table, $row, $format );

		if ( ! $result ) {
			return false;
		}

		$entry_id = $wpdb->insert_id;

		foreach ( $values as $value ) {
			$wpdb->insert(
				$this->values_table,
				[
					'entry_id'    => $entry_id,
					'field_id'    => sanitize_text_field( $value['field_id'] ?? '' ),
					'field_label' => sanitize_text_field( $value['field_label'] ?? '' ),
					'field_value' => $value['field_value'] ?? '',
				],
				[ '%d', '%s', '%s', '%s' ]
			);
		}

		return $entry_id;
	}

	/**
	 * Persist a single key/value piece of meta for an entry. Used by
	 * actions (e.g. Stripe) to stash session ids, payment status, redirect.
	 */
	public function set_meta( int $entry_id, string $key, string $value ): void {
		global $wpdb;
		if ( ! $this->meta_table_exists() ) {
			return;
		}
		$existing = $wpdb->get_var( $wpdb->prepare( // phpcs:ignore
			"SELECT id FROM {$this->meta_table} WHERE entry_id = %d AND meta_key = %s LIMIT 1",
			$entry_id,
			$key
		) );
		if ( $existing ) {
			$wpdb->update(
				$this->meta_table,
				[ 'meta_value' => $value ],
				[ 'id' => (int) $existing ],
				[ '%s' ],
				[ '%d' ]
			);
		} else {
			$wpdb->insert(
				$this->meta_table,
				[
					'entry_id'   => $entry_id,
					'meta_key'   => sanitize_key( $key ),
					'meta_value' => $value,
				],
				[ '%d', '%s', '%s' ]
			);
		}
	}

	public function get_meta( int $entry_id, string $key ): string {
		global $wpdb;
		if ( ! $this->meta_table_exists() ) {
			return '';
		}
		$val = $wpdb->get_var( $wpdb->prepare( // phpcs:ignore
			"SELECT meta_value FROM {$this->meta_table} WHERE entry_id = %d AND meta_key = %s LIMIT 1",
			$entry_id,
			$key
		) );
		return (string) ( $val ?? '' );
	}

	/**
	 * @return array<string,string>
	 */
	public function get_meta_all( int $entry_id ): array {
		global $wpdb;
		if ( ! $this->meta_table_exists() ) {
			return [];
		}
		$rows = $wpdb->get_results( $wpdb->prepare( // phpcs:ignore
			"SELECT meta_key, meta_value FROM {$this->meta_table} WHERE entry_id = %d",
			$entry_id
		), ARRAY_A );

		$out = [];
		foreach ( $rows ?: [] as $row ) {
			$out[ (string) $row['meta_key'] ] = (string) $row['meta_value'];
		}
		return $out;
	}

	/**
	 * Find the most recent entry by a single meta key/value (e.g. Stripe
	 * checkout session id) — used by the Stripe webhook handler.
	 */
	public function find_by_meta( string $key, string $value ): ?array {
		global $wpdb;
		if ( ! $this->meta_table_exists() ) {
			return null;
		}
		$id = $wpdb->get_var( $wpdb->prepare( // phpcs:ignore
			"SELECT entry_id FROM {$this->meta_table} WHERE meta_key = %s AND meta_value = %s ORDER BY id DESC LIMIT 1",
			$key,
			$value
		) );
		return $id ? $this->get( (int) $id ) : null;
	}

	private function meta_table_exists(): bool {
		global $wpdb;
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->get_var( "SHOW TABLES LIKE '{$this->meta_table}'" ) === $this->meta_table;
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

	public function update_status( int $id, string $status ): bool {
		global $wpdb;

		$allowed = [ 'unread', 'read', 'starred', 'spam', 'trash' ];

		if ( ! in_array( $status, $allowed, true ) ) {
			return false;
		}

		$result = $wpdb->update( $this->table, [ 'status' => $status ], [ 'id' => $id ], [ '%s' ], [ '%d' ] );

		return false !== $result;
	}

	public function delete( int $id ): bool {
		global $wpdb;

		$wpdb->delete( $this->values_table, [ 'entry_id' => $id ], [ '%d' ] );
		if ( $this->meta_table_exists() ) {
			$wpdb->delete( $this->meta_table, [ 'entry_id' => $id ], [ '%d' ] );
		}
		$result = $wpdb->delete( $this->table, [ 'id' => $id ], [ '%d' ] );

		return false !== $result;
	}

	public function export_csv( int $form_id ): array {
		global $wpdb;

		$entries = $wpdb->get_results( // phpcs:ignore
			$wpdb->prepare(
				"SELECT e.*, GROUP_CONCAT(CONCAT(v.field_label, ':', v.field_value) SEPARATOR '||') as values_str
				FROM {$this->table} e
				LEFT JOIN {$this->values_table} v ON e.id = v.entry_id
				WHERE e.form_id = %d AND e.status != 'trash'
				GROUP BY e.id
				ORDER BY e.created_at DESC",
				$form_id
			),
			ARRAY_A
		);

		return $entries ?: [];
	}
}
