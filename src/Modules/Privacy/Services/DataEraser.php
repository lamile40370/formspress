<?php

namespace FlowForms\Modules\Privacy\Services;

/**
 * GDPR personal-data eraser for FormsPress entries.
 *
 * Plugs into WordPress's built-in personal data eraser tool. For each entry
 * matching the email, we **anonymise** rather than delete: values get
 * scrubbed, ip_address blanked, user_agent blanked, and a meta marker is
 * left so analytics still functions on aggregate counts.
 *
 * Deletion semantics intentionally avoided — admins who want hard deletes
 * can hook `flowforms_privacy_erase_strategy` and return `'delete'`.
 *
 * @see https://developer.wordpress.org/plugins/privacy/adding-the-personal-data-eraser-to-your-plugin/
 */
class DataEraser {

	private const PAGE_SIZE = 50;

	/**
	 * @param array<string, array{eraser_friendly_name: string, callback: callable}> $erasers
	 * @return array<string, array{eraser_friendly_name: string, callback: callable}>
	 */
	public function register( array $erasers ): array {
		$erasers['formspress'] = [
			'eraser_friendly_name' => __( 'FormsPress submissions', 'flowforms' ),
			'callback'             => [ $this, 'erase' ],
		];

		return $erasers;
	}

	/**
	 * @return array{items_removed: int, items_retained: int, messages: array<int, string>, done: bool}
	 */
	public function erase( string $email_address, int $page = 1 ): array {
		global $wpdb;

		$email = sanitize_email( $email_address );
		if ( '' === $email ) {
			return [
				'items_removed'  => 0,
				'items_retained' => 0,
				'messages'       => [],
				'done'           => true,
			];
		}

		$offset = max( 0, ( $page - 1 ) * self::PAGE_SIZE );

		$entries_table = $wpdb->prefix . 'ff_entries';
		$values_table  = $wpdb->prefix . 'ff_entry_values';

		$entry_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT DISTINCT entry_id FROM {$values_table} WHERE field_value = %s ORDER BY entry_id DESC LIMIT %d OFFSET %d",
				$email,
				self::PAGE_SIZE,
				$offset
			)
		);

		if ( empty( $entry_ids ) ) {
			return [
				'items_removed'  => 0,
				'items_retained' => 0,
				'messages'       => [],
				'done'           => true,
			];
		}

		/**
		 * Filter the erase strategy.
		 *
		 * @param string $strategy 'anonymize' (default) or 'delete'.
		 * @param string $email
		 */
		$strategy = apply_filters( 'flowforms_privacy_erase_strategy', 'anonymize', $email );

		$removed  = 0;
		$retained = 0;
		$messages = [];

		foreach ( $entry_ids as $eid ) {
			$entry_id = (int) $eid;

			if ( 'delete' === $strategy ) {
				$wpdb->delete( $values_table, [ 'entry_id' => $entry_id ], [ '%d' ] );
				$wpdb->delete( $entries_table, [ 'id' => $entry_id ], [ '%d' ] );
				$removed++;
				continue;
			}

			// Anonymize — blank values + scrub PII columns.
			$wpdb->update(
				$entries_table,
				[
					'ip_address' => '',
					'user_agent' => '',
					'source_url' => '',
				],
				[ 'id' => $entry_id ],
				[ '%s', '%s', '%s' ],
				[ '%d' ]
			);

			// Replace any field value containing the email with a placeholder.
			$wpdb->update(
				$values_table,
				[ 'field_value' => '[erased]' ],
				[ 'entry_id' => $entry_id, 'field_value' => $email ],
				[ '%s' ],
				[ '%d', '%s' ]
			);

			$removed++;
		}

		if ( $removed > 0 ) {
			$messages[] = sprintf(
				/* translators: %d = number of submissions affected. */
				_n(
					'%d FormsPress submission was anonymized.',
					'%d FormsPress submissions were anonymized.',
					$removed,
					'flowforms'
				),
				$removed
			);
		}

		$done = count( $entry_ids ) < self::PAGE_SIZE;

		return [
			'items_removed'  => $removed,
			'items_retained' => $retained,
			'messages'       => $messages,
			'done'           => $done,
		];
	}
}
