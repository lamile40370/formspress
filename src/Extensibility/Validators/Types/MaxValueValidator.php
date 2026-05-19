<?php

namespace FlowForms\Extensibility\Validators\Types;

use FlowForms\Extensibility\Validators\AbstractValidator;

class MaxValueValidator extends AbstractValidator {

	public function get_id(): string {
		return 'max_value';
	}

	public function get_label(): string {
		return __( 'Maximum value', 'flowforms' );
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'max', 'type' => 'number', 'label' => __( 'Maximum value', 'flowforms' ), 'default' => 100 ],
		];
	}

	public function validate( mixed $value, array $config, array $field ): true|string {
		if ( $value === '' || $value === null ) {
			return true;
		}
		if ( ! is_numeric( $value ) ) {
			return __( 'Please enter a valid number.', 'flowforms' );
		}
		$max = (float) ( $config['max'] ?? 0 );
		if ( (float) $value > $max ) {
			return sprintf(
				/* translators: %s is maximum value */
				__( 'Value must be no more than %s.', 'flowforms' ),
				$max
			);
		}
		return true;
	}
}
