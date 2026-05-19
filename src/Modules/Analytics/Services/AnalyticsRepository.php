<?php

namespace FlowForms\Modules\Analytics\Services;

class AnalyticsRepository {

	private string $table;

	public function __construct() {
		global $wpdb;
		$this->table = $wpdb->prefix . 'ff_analytics';
	}

	/**
	 * Insert a single analytics event row.
	 *
	 * @param array<string,mixed> $data
	 */
	public function insert( array $data ): bool {
		global $wpdb;

		$row = [
			'form_id'         => (int) ( $data['form_id'] ?? 0 ),
			'variant_id'      => isset( $data['variant_id'] ) && $data['variant_id'] !== '' ? substr( (string) $data['variant_id'], 0, 32 ) : null,
			'event'           => substr( (string) ( $data['event'] ?? '' ), 0, 32 ),
			'step_index'      => isset( $data['step_index'] ) && '' !== $data['step_index'] ? (int) $data['step_index'] : null,
			'session_id'      => substr( (string) ( $data['session_id'] ?? '' ), 0, 64 ),
			'referrer'        => isset( $data['referrer'] ) && $data['referrer'] !== '' ? substr( (string) $data['referrer'], 0, 255 ) : null,
			'user_agent_hash' => isset( $data['user_agent_hash'] ) ? substr( (string) $data['user_agent_hash'], 0, 32 ) : null,
			'country_code'    => isset( $data['country_code'] ) && $data['country_code'] !== '' ? substr( (string) $data['country_code'], 0, 2 ) : null,
			'created_at'      => current_time( 'mysql' ),
		];

		if ( ! $row['form_id'] || ! $row['event'] || ! $row['session_id'] ) {
			return false;
		}

		$result = $wpdb->insert(
			$this->table,
			$row,
			[ '%d', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s' ]
		);

		return false !== $result;
	}

	/**
	 * Aggregate counts of every event for a form within a date range.
	 *
	 * @return array<string,int>
	 */
	public function event_totals( int $form_id, string $since ): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT event, COUNT(*) as c FROM {$this->table} WHERE form_id = %d AND created_at >= %s GROUP BY event",
				$form_id,
				$since
			),
			ARRAY_A
		);

		$out = [ 'view' => 0, 'start' => 0, 'step' => 0, 'submit' => 0, 'abandon' => 0 ];
		foreach ( ( $rows ?: [] ) as $r ) {
			$out[ $r['event'] ] = (int) $r['c'];
		}
		return $out;
	}

	/**
	 * Per-day breakdown of views / starts / submits / abandons.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public function by_day( int $form_id, string $since ): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT DATE(created_at) as day, event, COUNT(*) as c
				 FROM {$this->table}
				 WHERE form_id = %d AND created_at >= %s
				 GROUP BY DATE(created_at), event",
				$form_id,
				$since
			),
			ARRAY_A
		);

		$map = [];
		foreach ( ( $rows ?: [] ) as $r ) {
			$day = $r['day'];
			if ( ! isset( $map[ $day ] ) ) {
				$map[ $day ] = [ 'date' => $day, 'views' => 0, 'starts' => 0, 'submits' => 0, 'abandons' => 0 ];
			}
			$bucket = match ( $r['event'] ) {
				'view'    => 'views',
				'start'   => 'starts',
				'submit'  => 'submits',
				'abandon' => 'abandons',
				default   => null,
			};
			if ( $bucket ) {
				$map[ $day ][ $bucket ] = (int) $r['c'];
			}
		}

		ksort( $map );
		return array_values( $map );
	}

	/**
	 * Per-step visitor count (unique sessions reaching a step).
	 *
	 * @return array<int,int>  Map step_index → unique visitors
	 */
	public function step_visitors( int $form_id, string $since ): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT step_index, COUNT(DISTINCT session_id) as c
				 FROM {$this->table}
				 WHERE form_id = %d AND event = 'step' AND step_index IS NOT NULL AND created_at >= %s
				 GROUP BY step_index",
				$form_id,
				$since
			),
			ARRAY_A
		);

		$out = [];
		foreach ( ( $rows ?: [] ) as $r ) {
			$out[ (int) $r['step_index'] ] = (int) $r['c'];
		}
		return $out;
	}

	/**
	 * Top referrers.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public function top_referrers( int $form_id, string $since, int $limit = 5 ): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT referrer, COUNT(*) as c
				 FROM {$this->table}
				 WHERE form_id = %d AND event = 'view' AND referrer IS NOT NULL AND referrer != '' AND created_at >= %s
				 GROUP BY referrer
				 ORDER BY c DESC
				 LIMIT %d",
				$form_id,
				$since,
				$limit
			),
			ARRAY_A
		);

		return array_map(
			fn( $r ) => [ 'referrer' => $r['referrer'], 'count' => (int) $r['c'] ],
			$rows ?: []
		);
	}

	/**
	 * Top countries.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public function top_countries( int $form_id, string $since, int $limit = 5 ): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT country_code, COUNT(*) as c
				 FROM {$this->table}
				 WHERE form_id = %d AND event = 'view' AND country_code IS NOT NULL AND country_code != '' AND created_at >= %s
				 GROUP BY country_code
				 ORDER BY c DESC
				 LIMIT %d",
				$form_id,
				$since,
				$limit
			),
			ARRAY_A
		);

		return array_map(
			fn( $r ) => [ 'country_code' => $r['country_code'], 'count' => (int) $r['c'] ],
			$rows ?: []
		);
	}

	/**
	 * Variant comparison: views + submits per variant_id.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public function variant_stats( int $form_id, string $since ): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT variant_id, event, COUNT(*) as c
				 FROM {$this->table}
				 WHERE form_id = %d AND variant_id IS NOT NULL AND variant_id != '' AND created_at >= %s
				 GROUP BY variant_id, event",
				$form_id,
				$since
			),
			ARRAY_A
		);

		$map = [];
		foreach ( ( $rows ?: [] ) as $r ) {
			$vid = $r['variant_id'];
			if ( ! isset( $map[ $vid ] ) ) {
				$map[ $vid ] = [ 'variant_id' => $vid, 'views' => 0, 'submits' => 0, 'rate' => 0.0 ];
			}
			if ( 'view' === $r['event'] ) {
				$map[ $vid ]['views'] = (int) $r['c'];
			} elseif ( 'submit' === $r['event'] ) {
				$map[ $vid ]['submits'] = (int) $r['c'];
			}
		}

		foreach ( $map as &$v ) {
			$v['rate'] = $v['views'] > 0 ? round( ( $v['submits'] / $v['views'] ) * 100, 1 ) : 0.0;
		}
		unset( $v );

		return array_values( $map );
	}

	/**
	 * Aggregate views + submits across all forms for the last N days.
	 *
	 * @return array<string,int>
	 */
	public function global_totals_since( string $since ): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT event, COUNT(*) as c FROM {$this->table} WHERE created_at >= %s GROUP BY event",
				$since
			),
			ARRAY_A
		);

		$out = [ 'views' => 0, 'starts' => 0, 'submits' => 0, 'abandons' => 0 ];
		foreach ( ( $rows ?: [] ) as $r ) {
			$bucket = match ( $r['event'] ) {
				'view'    => 'views',
				'start'   => 'starts',
				'submit'  => 'submits',
				'abandon' => 'abandons',
				default   => null,
			};
			if ( $bucket ) {
				$out[ $bucket ] = (int) $r['c'];
			}
		}
		return $out;
	}

	/**
	 * Top forms by completion rate (submits / views) within a window.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public function top_forms_by_completion( string $since, int $limit = 5 ): array {
		global $wpdb;

		$forms_table = $wpdb->prefix . 'ff_forms';

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT a.form_id,
					SUM(CASE WHEN a.event = 'view'   THEN 1 ELSE 0 END) AS views,
					SUM(CASE WHEN a.event = 'submit' THEN 1 ELSE 0 END) AS submits,
					f.title
				 FROM {$this->table} a
				 LEFT JOIN {$forms_table} f ON f.id = a.form_id
				 WHERE a.created_at >= %s AND f.status != 'trash'
				 GROUP BY a.form_id
				 HAVING views > 0
				 ORDER BY (submits / views) DESC, submits DESC
				 LIMIT %d",
				$since,
				$limit
			),
			ARRAY_A
		);

		return array_map(
			fn( $r ) => [
				'form_id'         => (int) $r['form_id'],
				'title'           => $r['title'],
				'views'           => (int) $r['views'],
				'submits'         => (int) $r['submits'],
				'completion_rate' => ( (int) $r['views'] > 0 )
					? round( ( (int) $r['submits'] / (int) $r['views'] ) * 100, 1 )
					: 0.0,
			],
			$rows ?: []
		);
	}

	/**
	 * Delete events older than $days days. Returns rows deleted.
	 */
	public function cleanup_older_than( int $days ): int {
		global $wpdb;

		$cutoff = gmdate( 'Y-m-d H:i:s', time() - ( $days * DAY_IN_SECONDS ) );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$result = $wpdb->query(
			$wpdb->prepare( "DELETE FROM {$this->table} WHERE created_at < %s", $cutoff )
		);

		return (int) $result;
	}
}
