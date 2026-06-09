<?php

namespace FlowForms\Modules\Privacy\Services;

/**
 * GDPR personal-data exporter for FormsPress entries.
 *
 * Plugs into WordPress's built-in personal data export tool
 * (Tools → Export Personal Data). For a given email address we surface
 * every entry whose value list contains that email, paginated 50 at a time.
 *
 * @see https://developer.wordpress.org/plugins/privacy/adding-the-personal-data-exporter-to-your-plugin/
 */
class DataExporter {

	private const PAGE_SIZE = 50;

	/**
	 * Hook into the WP exporters list.
	 *
	 * @param array<string, array{exporter_friendly_name: string, callback: callable}> $exporters
	 * @return array<string, array{exporter_friendly_name: string, callback: callable}>
	 */
	public function register( array $exporters ): array {
		$exporters['formspress'] = [
			'exporter_friendly_name' => __( 'FormsPress submissions', 'formspress' ),
			'callback'               => [ $this, 'export' ],
		];

		return $exporters;
	}

	/**
	 * Export callback. Returns the WP-expected shape.
	 *
	 * @return array{data: array<int, array{group_id: string, group_label: string, item_id: string, data: array<int, array{name: string, value: string}>}>, done: bool}
	 */
	public function export( string $email_address, int $page = 1 ): array {
		global $wpdb;

		$email = sanitize_email( $email_address );
		if ( '' === $email ) {
			return [ 'data' => [], 'done' => true ];
		}

		$offset = max( 0, ( $page - 1 ) * self::PAGE_SIZE );

		$entries_table = $wpdb->prefix . 'ff_entries';
		$values_table  = $wpdb->prefix . 'ff_entry_values';

		// Find entry_ids whose value list contains this email (any field).
		// We compare on the value column with an exact match — addresses
		// stored with surrounding whitespace are normalised by the renderer.
		$entry_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT DISTINCT entry_id FROM {$values_table} WHERE field_value = %s ORDER BY entry_id DESC LIMIT %d OFFSET %d",
				$email,
				self::PAGE_SIZE,
				$offset
			)
		);

		if ( empty( $entry_ids ) ) {
			return [ 'data' => [], 'done' => true ];
		}

		$placeholders = implode( ',', array_fill( 0, count( $entry_ids ), '%d' ) );

		$entries = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT id, form_id, created_at, source_url, ip_address FROM {$entries_table} WHERE id IN ({$placeholders})", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				...array_map( 'intval', $entry_ids )
			),
			ARRAY_A
		);

		$values = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT entry_id, field_label, field_value FROM {$values_table} WHERE entry_id IN ({$placeholders}) ORDER BY id ASC", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				...array_map( 'intval', $entry_ids )
			),
			ARRAY_A
		);

		$by_entry = [];
		foreach ( $values as $row ) {
			$by_entry[ (int) $row['entry_id'] ][] = $row;
		}

		$data = [];
		foreach ( $entries as $entry ) {
			$entry_id = (int) $entry['id'];

			$items = [
				[
					'name'  => __( 'Submission date', 'formspress' ),
					'value' => $entry['created_at'],
				],
				[
					'name'  => __( 'Form ID', 'formspress' ),
					'value' => (string) $entry['form_id'],
				],
				[
					'name'  => __( 'Source URL', 'formspress' ),
					'value' => $entry['source_url'] ?: '',
				],
				[
					'name'  => __( 'IP address', 'formspress' ),
					'value' => $entry['ip_address'] ?: '',
				],
			];

			foreach ( $by_entry[ $entry_id ] ?? [] as $value_row ) {
				$items[] = [
					'name'  => $value_row['field_label'] ?: __( 'Field', 'formspress' ),
					'value' => (string) $value_row['field_value'],
				];
			}

			$data[] = [
				'group_id'    => 'formspress-entry',
				'group_label' => __( 'Form submissions', 'formspress' ),
				'item_id'     => 'formspress-entry-' . $entry_id,
				'data'        => $items,
			];
		}

		// "done" when we got fewer than a full page.
		$done = count( $entry_ids ) < self::PAGE_SIZE;

		return [ 'data' => $data, 'done' => $done ];
	}
}
