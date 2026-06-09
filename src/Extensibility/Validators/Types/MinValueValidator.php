<?php

namespace FlowForms\Extensibility\Validators\Types;

use FlowForms\Extensibility\Validators\AbstractValidator;

class MinValueValidator extends AbstractValidator {

	public function get_id(): string {
		return 'min_value';
	}

	public function get_label(): string {
		return __( 'Minimum value', 'formspress' );
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'min', 'type' => 'number', 'label' => __( 'Minimum value', 'formspress' ), 'default' => 0 ],
		];
	}

	public function validate( mixed $value, array $config, array $field ): true|string {
		if ( $value === '' || $value === null ) {
			return true;
		}
		if ( ! is_numeric( $value ) ) {
			return __( 'Please enter a valid number.', 'formspress' );
		}
		$min = (float) ( $config['min'] ?? 0 );
		if ( (float) $value < $min ) {
			return sprintf(
				/* translators: %s is minimum value */
				__( 'Value must be at least %s.', 'formspress' ),
				$min
			);
		}
		return true;
	}
}
