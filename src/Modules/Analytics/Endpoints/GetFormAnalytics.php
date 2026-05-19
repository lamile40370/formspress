<?php

namespace FlowForms\Modules\Analytics\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Analytics\Services\AnalyticsRepository;
use FlowForms\Modules\Forms\Services\FormRepository;
use WP_REST_Request;
use WP_REST_Response;

class GetFormAnalytics extends AbstractEndpoint {

	public function __construct(
		private readonly AnalyticsRepository $repo,
		private readonly FormRepository $form_repo,
	) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$form_id = (int) $request->get_param( 'id' );
		$range   = (int) ( $request->get_param( 'range' ) ?: 14 );
		if ( ! in_array( $range, [ 7, 14, 30, 90 ], true ) ) {
			$range = 14;
		}

		$form = $this->form_repo->get( $form_id );
		if ( ! $form ) {
			return $this->error( __( 'Form not found.', 'flowforms' ), 404 );
		}

		$since = gmdate( 'Y-m-d 00:00:00', time() - $range * DAY_IN_SECONDS );

		$totals = $this->repo->event_totals( $form_id, $since );
		$views     = $totals['view'];
		$starts    = $totals['start'];
		$submits   = $totals['submit'];

		$completion_rate     = $starts  > 0 ? round( ( $submits / $starts ) * 100, 1 ) : 0.0;
		$view_to_submit_rate = $views   > 0 ? round( ( $submits / $views  ) * 100, 1 ) : 0.0;

		/* by_day — backfill missing dates. */
		$by_day_raw = $this->repo->by_day( $form_id, $since );
		$map = [];
		foreach ( $by_day_raw as $row ) {
			$map[ $row['date'] ] = $row;
		}
		$by_day = [];
		$today  = current_time( 'Y-m-d' );
		for ( $i = $range - 1; $i >= 0; $i-- ) {
			$d = gmdate( 'Y-m-d', strtotime( $today . " -{$i} days" ) );
			$by_day[] = $map[ $d ] ?? [ 'date' => $d, 'views' => 0, 'starts' => 0, 'submits' => 0, 'abandons' => 0 ];
		}

		/* Funnel — build labels from form fields (split by page_break) + step visitors. */
		$funnel = $this->build_funnel( $form, $form_id, $since, $views, $submits );

		$response = [
			'range'               => $range,
			'views'               => $views,
			'starts'              => $starts,
			'submits'             => $submits,
			'abandons'            => $totals['abandon'],
			'completion_rate'     => $completion_rate,
			'view_to_submit_rate' => $view_to_submit_rate,
			'by_day'              => $by_day,
			'funnel'              => $funnel,
			'top_referrers'       => $this->repo->top_referrers( $form_id, $since, 8 ),
			'top_countries'       => $this->repo->top_countries( $form_id, $since, 8 ),
			'variants'            => $this->repo->variant_stats( $form_id, $since ),
		];

		return $this->success( $response );
	}

	/**
	 * Build a funnel: views → step 1 visitors → step 2 → … → submits.
	 *
	 * Step labels are derived from page boundaries (standard forms) or from the
	 * `activeFields` list (flow forms).
	 *
	 * @param array<string,mixed> $form
	 * @return array<int,array<string,mixed>>
	 */
	private function build_funnel( array $form, int $form_id, string $since, int $views, int $submits ): array {
		$step_visitors = $this->repo->step_visitors( $form_id, $since );
		$steps         = $this->derive_step_labels( $form );

		$funnel = [];
		$prev   = $views;

		foreach ( $steps as $i => $label ) {
			$visitors = $step_visitors[ $i ] ?? 0;
			$dropoff  = $prev > 0 ? round( ( ( $prev - $visitors ) / $prev ) * 100, 1 ) : 0.0;
			if ( $dropoff < 0 ) { /* Visitors > previous (rare). */
				$dropoff = 0.0;
			}
			$funnel[] = [
				'step'     => $i,
				'label'    => $label,
				'visitors' => $visitors,
				'dropoff'  => $dropoff,
			];
			$prev = $visitors > 0 ? $visitors : $prev;
		}

		/* Final submit step. */
		$dropoff = $prev > 0 ? round( ( ( $prev - $submits ) / $prev ) * 100, 1 ) : 0.0;
		if ( $dropoff < 0 ) {
			$dropoff = 0.0;
		}
		$funnel[] = [
			'step'     => count( $steps ),
			'label'    => __( 'Submit', 'flowforms' ),
			'visitors' => $submits,
			'dropoff'  => $dropoff,
		];

		/* Prepend the entry "view" point so the chart shows the full funnel. */
		array_unshift( $funnel, [
			'step'     => -1,
			'label'    => __( 'Form viewed', 'flowforms' ),
			'visitors' => $views,
			'dropoff'  => 0.0,
		] );

		return $funnel;
	}

	/**
	 * @param array<string,mixed> $form
	 * @return array<int,string>
	 */
	private function derive_step_labels( array $form ): array {
		$type   = $form['type'] ?? 'standard';
		$fields = $form['fields'] ?? [];

		if ( 'flow' === $type ) {
			/* Flow forms: each non-section/page_break/hidden field is a step. */
			$out = [];
			foreach ( $fields as $f ) {
				if ( in_array( $f['type'] ?? '', [ 'section', 'page_break', 'hidden' ], true ) ) {
					continue;
				}
				$out[] = (string) ( $f['label'] ?? $f['id'] ?? '' );
			}
			return $out;
		}

		/* Standard forms: step = page (split by page_break). Label = first
		 * field label on the page, or "Page N". */
		$pages   = [ [] ];
		$current = 0;
		foreach ( $fields as $f ) {
			if ( ( $f['type'] ?? '' ) === 'page_break' ) {
				$current++;
				$pages[ $current ] = [];
				continue;
			}
			$pages[ $current ][] = $f;
		}

		$out = [];
		foreach ( $pages as $i => $page_fields ) {
			$label = '';
			foreach ( $page_fields as $f ) {
				if ( ! empty( $f['label'] ) ) {
					$label = (string) $f['label'];
					break;
				}
			}
			$out[] = $label !== '' ? $label : sprintf( __( 'Page %d', 'flowforms' ), $i + 1 );
		}
		return $out;
	}
}
