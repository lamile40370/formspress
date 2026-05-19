<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class NumberFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'number';
	}

	public function get_label(): string {
		return __( 'Number', 'flowforms' );
	}

	public function get_group(): string {
		return 'basic';
	}

	public function get_icon(): string {
		return 'calculator';
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'placeholder', 'type' => 'text',   'label' => __( 'Placeholder', 'flowforms' ) ],
			[ 'key' => 'min',         'type' => 'number', 'label' => __( 'Minimum value', 'flowforms' ) ],
			[ 'key' => 'max',         'type' => 'number', 'label' => __( 'Maximum value', 'flowforms' ) ],
		];
	}

	public function render_frontend( array $field ): string {
		$id          = esc_attr( $field['id'] ?? '' );
		$req         = ! empty( $field['required'] ) ? 'required' : '';
		$placeholder = esc_attr( $field['placeholder'] ?? '' );
		return '<input type="number" name="' . $id . '" id="ff-field-' . $id . '" class="ff-form__input" placeholder="' . $placeholder . '" ' . $req . ' />';
	}

	public function validate( mixed $value, array $field ): true|string {
		if ( $value === '' || $value === null ) {
			return true;
		}
		if ( ! is_numeric( $value ) ) {
			return __( 'Please enter a valid number.', 'flowforms' );
		}
		return true;
	}

	public function sanitize( mixed $value, array $field ): mixed {
		return (string) floatval( $value );
	}
}
