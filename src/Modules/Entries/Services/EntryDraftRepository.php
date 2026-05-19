<?php

namespace FlowForms\Modules\Entries\Services;

class EntryDraftRepository {

	private string $table;

	public function __construct() {
		global $wpdb;
		$this->table = $wpdb->prefix . 'ff_entry_drafts';
	}

	public function generate_token(): string {
		return bin2hex( random_bytes( 24 ) );
	}

	/**
	 * Create a new draft row.
	 *
	 * @param array<string,mixed> $data
	 */
	public function create( int $form_id, string $email, array $data, int $current_step = 0, int $ttl_days = 30 ): ?array {
		global $wpdb;

		$token   = $this->generate_token();
		$expires = gmdate( 'Y-m-d H:i:s', time() + ( $ttl_days * DAY_IN_SECONDS ) );

		$result = $wpdb->insert(
			$this->table,
			[
				'form_id'      => $form_id,
				'token'        => $token,
				'email'        => sanitize_email( $email ),
				'data'         => wp_json_encode( $data ),
				'current_step' => $current_step,
				'expires_at'   => $expires,
			],
			[ '%d', '%s', '%s', '%s', '%d', '%s' ]
		);

		if ( ! $result ) {
			return null;
		}

		return $this->get_by_token( $token );
	}

	/**
	 * @param array<string,mixed> $data
	 */
	public function update( string $token, array $data, int $current_step, ?string $email = null ): ?array {
		global $wpdb;

		$existing = $this->get_by_token( $token );
		if ( ! $existing ) {
			return null;
		}

		$fields  = [
			'data'         => wp_json_encode( $data ),
			'current_step' => $current_step,
			'updated_at'   => current_time( 'mysql', true ),
		];
		$formats = [ '%s', '%d', '%s' ];

		if ( null !== $email && '' !== $email ) {
			$fields['email'] = sanitize_email( $email );
			$formats[]       = '%s';
		}

		$wpdb->update( $this->table, $fields, [ 'token' => $token ], $formats, [ '%s' ] );

		return $this->get_by_token( $token );
	}

	public function get_by_token( string $token ): ?array {
		global $wpdb;

		$row = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$this->table} WHERE token = %s", $token ), // phpcs:ignore
			ARRAY_A
		);

		if ( ! $row ) {
			return null;
		}

		// Expiry check.
		if ( ! empty( $row['expires_at'] ) && strtotime( $row['expires_at'] ) < time() ) {
			return null;
		}

		$row['data'] = json_decode( $row['data'] ?? '{}', true ) ?: [];

		return $row;
	}

	public function delete_by_token( string $token ): bool {
		global $wpdb;

		return (bool) $wpdb->delete( $this->table, [ 'token' => $token ], [ '%s' ] );
	}

	public function purge_expired(): int {
		global $wpdb;

		$now = current_time( 'mysql', true );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return (int) $wpdb->query( $wpdb->prepare( "DELETE FROM {$this->table} WHERE expires_at IS NOT NULL AND expires_at < %s", $now ) );
	}
}
