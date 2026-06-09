<?php

namespace FlowForms\Extensibility\Validators\Types;

use FlowForms\Extensibility\Validators\AbstractValidator;

class MaxLengthValidator extends AbstractValidator {

	public function get_id(): string {
		return 'max_length';
	}

	public function get_label(): string {
		return __( 'Maximum length', 'formspress' );
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'max', 'type' => 'number', 'label' => __( 'Maximum characters', 'formspress' ), 'default' => 255, 'min' => 1 ],
		];
	}

	public function validate( mixed $value, array $config, array $field ): true|string {
		if ( $value === '' || $value === null ) {
			return true;
		}
		$max = (int) ( $config['max'] ?? 255 );
		if ( mb_strlen( (string) $value ) > $max ) {
			return sprintf(
				/* translators: %d is maximum length */
				__( 'Must be no more than %d characters.', 'formspress' ),
				$max
			);
		}
		return true;
	}
}
