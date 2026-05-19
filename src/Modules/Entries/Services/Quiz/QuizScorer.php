<?php

namespace FlowForms\Modules\Entries\Services\Quiz;

use FlowForms\Modules\Entries\Services\Conditional\ConditionEvaluator;

/**
 * Computes the total quiz score for an entry by summing the per-option score
 * of every selected answer. Result screens are tested in declaration order;
 * the first whose [min_score, max_score] range encloses the total wins.
 *
 * Field option shape supported:
 *   - plain string             "Paris"            (score = 0)
 *   - associative array        [ 'value' => 'Paris', 'score' => 5 ]
 */
class QuizScorer {

	/**
	 * @param array<int,array<string,mixed>>  $fields
	 * @param array<int,array<string,mixed>>  $entry_values
	 * @param array<string,mixed>             $quiz_settings
	 * @return array{score:float,max_score:float,result_screen:?array<string,mixed>}
	 */
	public function score( array $fields, array $entry_values, array $quiz_settings ): array {
		$flat = ( new ConditionEvaluator() )->flattenFields( $fields );

		/* Map of field_id => submitted value (string; comma-joined for multi). */
		$values = [];
		foreach ( $entry_values as $row ) {
			$values[ (string) ( $row['field_id'] ?? '' ) ] = (string) ( $row['field_value'] ?? '' );
		}

		$total     = 0.0;
		$max_total = 0.0;

		foreach ( $flat as $field ) {
			$type    = (string) ( $field['type'] ?? '' );
			$options = (array) ( $field['options'] ?? [] );

			if ( ! in_array( $type, [ 'radio', 'select', 'checkbox' ], true ) || empty( $options ) ) {
				continue;
			}

			$normalized = array_map( [ $this, 'normalize_option' ], $options );
			$option_scores = [];
			foreach ( $normalized as $opt ) {
				$option_scores[ $opt['value'] ] = (float) $opt['score'];
			}

			/* For radio/select max is the highest option score; for checkbox
			 * it's the sum of all positive scores (user could pick all). */
			if ( 'checkbox' === $type ) {
				$max_total += array_sum( array_filter( $option_scores, fn( $s ) => $s > 0 ) );
			} else {
				$max_total += empty( $option_scores ) ? 0.0 : max( $option_scores );
			}

			$submitted = $values[ (string) ( $field['id'] ?? '' ) ] ?? '';
			if ( '' === $submitted ) {
				continue;
			}

			$selected = 'checkbox' === $type
				? array_map( 'trim', explode( ',', $submitted ) )
				: [ $submitted ];

			foreach ( $selected as $sel ) {
				if ( isset( $option_scores[ $sel ] ) ) {
					$total += $option_scores[ $sel ];
				}
			}
		}

		$screen = $this->match_result_screen( (array) ( $quiz_settings['result_screens'] ?? [] ), $total );

		return [
			'score'         => (float) $total,
			'max_score'     => (float) $max_total,
			'result_screen' => $screen,
		];
	}

	/**
	 * @param mixed $opt
	 * @return array{value:string,score:float}
	 */
	private function normalize_option( mixed $opt ): array {
		if ( is_string( $opt ) ) {
			return [ 'value' => $opt, 'score' => 0.0 ];
		}
		if ( is_array( $opt ) ) {
			return [
				'value' => (string) ( $opt['value'] ?? '' ),
				'score' => (float) ( $opt['score'] ?? 0 ),
			];
		}
		return [ 'value' => (string) $opt, 'score' => 0.0 ];
	}

	/**
	 * @param array<int,array<string,mixed>> $screens
	 * @return array<string,mixed>|null
	 */
	private function match_result_screen( array $screens, float $total ): ?array {
		foreach ( $screens as $screen ) {
			$min = isset( $screen['min_score'] ) ? (float) $screen['min_score'] : -INF;
			$max = isset( $screen['max_score'] ) ? (float) $screen['max_score'] : INF;
			if ( $total >= $min && $total <= $max ) {
				return [
					'id'      => (string) ( $screen['id'] ?? '' ),
					'title'   => (string) ( $screen['title'] ?? '' ),
					'message' => (string) ( $screen['message'] ?? '' ),
				];
			}
		}
		return null;
	}
}
