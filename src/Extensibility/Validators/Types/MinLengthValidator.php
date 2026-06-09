<?php

namespace FlowForms\Extensibility\Validators\Types;

use FlowForms\Extensibility\Validators\AbstractValidator;

class MinLengthValidator extends AbstractValidator {

	public function get_id(): string {
		return 'min_length';
	}

	public function get_label(): string {
		return __( 'Minimum length', 'formspress' );
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'min', 'type' => 'number', 'label' => __( 'Minimum characters', 'formspress' ), 'default' => 1, 'min' => 0 ],
		];
	}

	public function validate( mixed $value, array $config, array $field ): true|string {
		if ( $value === '' || $value === null ) {
			return true;
		}
		$min = (int) ( $config['min'] ?? 0 );
		if ( mb_strlen( (string) $value ) < $min ) {
			return sprintf(
				/* translators: %d is minimum length */
				__( 'Must be at least %d characters.', 'formspress' ),
				$min
			);
		}
		return true;
	}
}
