<?php

namespace FlowForms\Modules\EmailTemplates\Services;

class EmailTemplateRepository {

	private string $table;

	public function __construct() {
		global $wpdb;
		$this->table = $wpdb->prefix . 'ff_email_templates';
	}

	public function get_all(): array {
		global $wpdb;
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results( "SELECT * FROM {$this->table} ORDER BY name ASC", ARRAY_A );
		return $rows ?: [];
	}

	public function get( int $id ): ?array {
		global $wpdb;
		$row = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$this->table} WHERE id = %d", $id ), // phpcs:ignore
			ARRAY_A
		);
		return $row ?: null;
	}

	public function create( array $data ): int|false {
		global $wpdb;
		$now    = current_time( 'mysql' );
		$result = $wpdb->insert(
			$this->table,
			[
				'name'       => sanitize_text_field( $data['name'] ?? __( 'Untitled Template', 'flowforms' ) ),
				'subject'    => sanitize_text_field( $data['subject'] ?? '' ),
				'body'       => wp_kses_post( $data['body'] ?? '' ),
				'created_at' => $now,
				'updated_at' => $now,
			],
			[ '%s', '%s', '%s', '%s', '%s' ]
		);

		return $result ? (int) $wpdb->insert_id : false;
	}

	public function update( int $id, array $data ): bool {
		global $wpdb;

		$update = [];
		$format = [];

		if ( isset( $data['name'] ) ) {
			$update['name'] = sanitize_text_field( $data['name'] );
			$format[]       = '%s';
		}

		if ( isset( $data['subject'] ) ) {
			$update['subject'] = sanitize_text_field( $data['subject'] );
			$format[]          = '%s';
		}

		if ( isset( $data['body'] ) ) {
			$update['body'] = wp_kses_post( $data['body'] );
			$format[]       = '%s';
		}

		if ( empty( $update ) ) {
			return false;
		}

		$update['updated_at'] = current_time( 'mysql' );
		$format[]             = '%s';

		$result = $wpdb->update( $this->table, $update, [ 'id' => $id ], $format, [ '%d' ] );

		return false !== $result;
	}

	public function delete( int $id ): bool {
		global $wpdb;
		$result = $wpdb->delete( $this->table, [ 'id' => $id ], [ '%d' ] );
		return false !== $result;
	}
}
