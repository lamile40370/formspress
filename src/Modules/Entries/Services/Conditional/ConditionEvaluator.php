<?php

namespace FlowForms\Modules\Entries\Services\Conditional;

/**
 * Evaluates conditional logic rules against a set of submitted values.
 *
 * Field condition shape:
 *   [
 *     'action' => 'show' | 'hide' | 'skip',
 *     'logic'  => 'all' | 'any',
 *     'rules'  => [
 *       [ 'field' => '<id>', 'op' => '<operator>', 'value' => mixed ],
 *       ...
 *     ],
 *   ]
 *
 * `evaluate()` returns true when the field should be considered VISIBLE / ACTIVE
 * (i.e. validation runs on it and its submitted value is persisted), false when
 * it should be considered HIDDEN / SKIPPED.
 */
class ConditionEvaluator {

	public const OPERATORS = [
		'equals',
		'not_equals',
		'contains',
		'not_contains',
		'is_empty',
		'is_not_empty',
		'is_truthy',
		'is_falsy',
		'greater_than',
		'less_than',
	];

	/**
	 * @param array<string,mixed> $conditions
	 * @param array<string,mixed> $values
	 */
	public function evaluate( array $conditions, array $values ): bool {
		// No conditions = always visible.
		if ( empty( $conditions ) || empty( $conditions['rules'] ) ) {
			return true;
		}

		$action = $conditions['action'] ?? 'show';
		$logic  = $conditions['logic']  ?? 'all';
		$rules  = $conditions['rules']  ?? [];

		$matched = $this->evaluateRules( $rules, $logic, $values );

		// "show" → visible when rules match.
		// "hide" → hidden when rules match (visible when not matched).
		// "skip" → hidden when rules match (treated like "hide" for visibility).
		if ( 'show' === $action ) {
			return $matched;
		}

		return ! $matched;
	}

	/**
	 * @param array<int,array<string,mixed>> $rules
	 * @param array<string,mixed>            $values
	 */
	private function evaluateRules( array $rules, string $logic, array $values ): bool {
		if ( empty( $rules ) ) {
			return true;
		}

		$results = array_map(
			fn( $rule ) => $this->evaluateRule( $rule, $values ),
			$rules
		);

		if ( 'any' === $logic ) {
			return in_array( true, $results, true );
		}

		// Default: all.
		return ! in_array( false, $results, true );
	}

	/**
	 * @param array<string,mixed> $rule
	 * @param array<string,mixed> $values
	 */
	private function evaluateRule( array $rule, array $values ): bool {
		$source_field = $rule['field'] ?? '';
		$op           = $rule['op']    ?? 'equals';
		$expected     = $rule['value'] ?? '';

		if ( '' === $source_field ) {
			return false;
		}

		$actual = $values[ $source_field ] ?? '';

		// Normalise: arrays (checkbox multi) → comma-joined string for text ops.
		if ( is_array( $actual ) ) {
			$actual_str = implode( ', ', array_map( 'strval', $actual ) );
		} else {
			$actual_str = (string) $actual;
		}

		switch ( $op ) {
			case 'equals':
				return $actual_str === (string) $expected;

			case 'not_equals':
				return $actual_str !== (string) $expected;

			case 'contains':
				return '' !== $actual_str
					&& '' !== (string) $expected
					&& false !== stripos( $actual_str, (string) $expected );

			case 'not_contains':
				return '' === (string) $expected
					|| false === stripos( $actual_str, (string) $expected );

			case 'is_empty':
				return '' === trim( $actual_str );

			case 'is_not_empty':
				return '' !== trim( $actual_str );

			case 'is_truthy':
				$truthy = [ '1', 'true', 'yes', 'on' ];
				return '' !== trim( $actual_str )
					&& ( in_array( strtolower( $actual_str ), $truthy, true ) || '0' !== $actual_str );

			case 'is_falsy':
				$falsy = [ '', '0', 'false', 'no', 'off' ];
				return in_array( strtolower( $actual_str ), $falsy, true );

			case 'greater_than':
				return is_numeric( $actual_str )
					&& is_numeric( $expected )
					&& (float) $actual_str > (float) $expected;

			case 'less_than':
				return is_numeric( $actual_str )
					&& is_numeric( $expected )
					&& (float) $actual_str < (float) $expected;
		}

		return false;
	}

	/**
	 * Walks the field tree (supporting rows/cols) and returns a flat list of
	 * field IDs that are considered visible/active given the submitted values.
	 *
	 * @param array<int,array<string,mixed>> $fields
	 * @param array<string,mixed>            $values
	 *
	 * @return array<int,string>
	 */
	public function visibleFieldIds( array $fields, array $values ): array {
		$visible = [];

		foreach ( $this->flattenFields( $fields ) as $field ) {
			$id         = $field['id'] ?? '';
			$conditions = $field['conditions'] ?? [];

			if ( '' === $id ) {
				continue;
			}

			if ( $this->evaluate( is_array( $conditions ) ? $conditions : [], $values ) ) {
				$visible[] = $id;
			}
		}

		return $visible;
	}

	/**
	 * Flatten a (possibly nested via rows/cols) field tree.
	 *
	 * @param array<int,array<string,mixed>> $fields
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public function flattenFields( array $fields ): array {
		$flat = [];

		foreach ( $fields as $field ) {
			if ( ( $field['type'] ?? '' ) === 'row' ) {
				foreach ( ( $field['cols'] ?? [] ) as $col ) {
					foreach ( ( $col['fields'] ?? [] ) as $child ) {
						$flat[] = $child;
					}
				}
				continue;
			}

			$flat[] = $field;
		}

		return $flat;
	}
}
