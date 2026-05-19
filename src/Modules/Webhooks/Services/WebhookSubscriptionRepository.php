<?php

namespace FlowForms\Modules\Webhooks\Services;

class WebhookSubscriptionRepository {

	private string $table;

	public function __construct() {
		global $wpdb;
		$this->table = $wpdb->prefix . 'ff_webhook_subscriptions';
	}

	/** @return array<int, array<string, mixed>> */
	public function get_all(): array {
		global $wpdb;
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results( "SELECT * FROM {$this->table} ORDER BY id DESC", ARRAY_A );

		return array_map( [ $this, 'hydrate' ], $rows ?: [] );
	}

	/** @return array<int, array<string, mixed>> */
	public function get_active_for_event( string $event ): array {
		$rows = $this->get_all();

		return array_values( array_filter(
			$rows,
			static fn( array $r ) => ! empty( $r['active'] ) && in_array( $event, (array) $r['events'], true )
		) );
	}

	public function get( int $id ): ?array {
		global $wpdb;
		$row = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$this->table} WHERE id = %d", $id ), // phpcs:ignore
			ARRAY_A
		);

		return $row ? $this->hydrate( $row ) : null;
	}

	public function create( array $data ): int|false {
		global $wpdb;

		$result = $wpdb->insert(
			$this->table,
			[
				'name'       => sanitize_text_field( $data['name']   ?? __( 'Untitled webhook', 'flowforms' ) ),
				'url'        => esc_url_raw(        $data['url']    ?? '' ),
				'events'     => implode( ',', array_map( 'sanitize_key', (array) ( $data['events'] ?? [] ) ) ),
				'secret'     => sanitize_text_field( $data['secret'] ?? wp_generate_password( 32, false, false ) ),
				'active'     => ! empty( $data['active'] ) ? 1 : 0,
				'created_at' => current_time( 'mysql' ),
			],
			[ '%s', '%s', '%s', '%s', '%d', '%s' ]
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
		if ( isset( $data['url'] ) ) {
			$update['url'] = esc_url_raw( $data['url'] );
			$format[]      = '%s';
		}
		if ( isset( $data['events'] ) ) {
			$update['events'] = implode( ',', array_map( 'sanitize_key', (array) $data['events'] ) );
			$format[]         = '%s';
		}
		if ( isset( $data['secret'] ) ) {
			$update['secret'] = sanitize_text_field( (string) $data['secret'] );
			$format[]         = '%s';
		}
		if ( isset( $data['active'] ) ) {
			$update['active'] = ! empty( $data['active'] ) ? 1 : 0;
			$format[]         = '%d';
		}

		if ( empty( $update ) ) {
			return false;
		}

		$result = $wpdb->update( $this->table, $update, [ 'id' => $id ], $format, [ '%d' ] );
		return false !== $result;
	}

	public function delete( int $id ): bool {
		global $wpdb;
		$result = $wpdb->delete( $this->table, [ 'id' => $id ], [ '%d' ] );
		return false !== $result;
	}

	private function hydrate( array $row ): array {
		$row['active'] = (int) ( $row['active'] ?? 0 );
		$row['events'] = $row['events']
			? array_values( array_filter( array_map( 'trim', explode( ',', (string) $row['events'] ) ) ) )
			: [];
		return $row;
	}
}
