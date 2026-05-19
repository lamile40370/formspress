<?php

namespace FlowForms\Modules\Dashboard\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use WP_REST_Request;
use WP_REST_Response;

class GetStats extends AbstractEndpoint {

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		global $wpdb;

		$forms_table   = $wpdb->prefix . 'ff_forms';
		$entries_table = $wpdb->prefix . 'ff_entries';

		$total_forms   = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$forms_table} WHERE status != 'trash'" ); // phpcs:ignore
		$active_forms  = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$forms_table} WHERE status = 'active'" ); // phpcs:ignore
		$total_entries = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$entries_table} WHERE status != 'trash'" ); // phpcs:ignore
		$unread        = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$entries_table} WHERE status = 'unread'" ); // phpcs:ignore

		$today         = current_time( 'Y-m-d' );
		$yesterday     = gmdate( 'Y-m-d', strtotime( $today . ' -1 day' ) );
		$week_ago      = gmdate( 'Y-m-d', strtotime( $today . ' -7 days' ) );
		$two_weeks_ago = gmdate( 'Y-m-d', strtotime( $today . ' -14 days' ) );

		$entries_today = (int) $wpdb->get_var( // phpcs:ignore
			$wpdb->prepare( "SELECT COUNT(*) FROM {$entries_table} WHERE DATE(created_at) = %s", $today )
		);

		$entries_yesterday = (int) $wpdb->get_var( // phpcs:ignore
			$wpdb->prepare( "SELECT COUNT(*) FROM {$entries_table} WHERE DATE(created_at) = %s", $yesterday )
		);

		$entries_this_week = (int) $wpdb->get_var( // phpcs:ignore
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$entries_table} WHERE DATE(created_at) > %s AND status != 'trash'",
				$week_ago
			)
		);

		$entries_last_week = (int) $wpdb->get_var( // phpcs:ignore
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$entries_table} WHERE DATE(created_at) > %s AND DATE(created_at) <= %s AND status != 'trash'",
				$two_weeks_ago,
				$week_ago
			)
		);

		/* Daily entry counts for the last 14 days (chart data). */
		$daily_raw = $wpdb->get_results( // phpcs:ignore
			$wpdb->prepare(
				"SELECT DATE(created_at) AS day, COUNT(*) AS count
				 FROM {$entries_table}
				 WHERE DATE(created_at) > %s AND status != 'trash'
				 GROUP BY DATE(created_at)",
				$two_weeks_ago
			),
			ARRAY_A
		);
		$daily_map = [];
		foreach ( ( $daily_raw ?: [] ) as $row ) {
			$daily_map[ $row['day'] ] = (int) $row['count'];
		}
		$entries_by_day = [];
		for ( $i = 13; $i >= 0; $i-- ) {
			$d = gmdate( 'Y-m-d', strtotime( $today . " -{$i} days" ) );
			$entries_by_day[] = [
				'date'  => $d,
				'count' => $daily_map[ $d ] ?? 0,
			];
		}

		/* Top 5 forms by entry count. */
		$top_forms = $wpdb->get_results( // phpcs:ignore
			"SELECT f.id, f.title, f.status, f.type, COUNT(e.id) AS entries_count
			 FROM {$forms_table} f
			 LEFT JOIN {$entries_table} e ON e.form_id = f.id AND e.status != 'trash'
			 WHERE f.status != 'trash'
			 GROUP BY f.id
			 ORDER BY entries_count DESC, f.created_at DESC
			 LIMIT 5",
			ARRAY_A
		);
		foreach ( ( $top_forms ?: [] ) as $i => $row ) {
			$top_forms[ $i ]['entries_count'] = (int) $row['entries_count'];
		}

		$recent_entries = $wpdb->get_results( // phpcs:ignore
			"SELECT e.id, e.form_id, e.status, e.created_at, f.title as form_title
			FROM {$entries_table} e
			LEFT JOIN {$forms_table} f ON e.form_id = f.id
			WHERE e.status != 'trash'
			ORDER BY e.created_at DESC
			LIMIT 8",
			ARRAY_A
		);

		return $this->success( [
			'total_forms'        => $total_forms,
			'active_forms'       => $active_forms,
			'total_entries'      => $total_entries,
			'unread_entries'     => $unread,
			'entries_today'      => $entries_today,
			'entries_yesterday'  => $entries_yesterday,
			'entries_this_week'  => $entries_this_week,
			'entries_last_week'  => $entries_last_week,
			'entries_by_day'     => $entries_by_day,
			'top_forms'          => $top_forms ?: [],
			'recent_entries'     => $recent_entries ?: [],
		] );
	}
}
