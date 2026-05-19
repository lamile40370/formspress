<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class EmailFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'email';
	}

	public function get_label(): string {
		return __( 'Email', 'flowforms' );
	}

	public function get_group(): string {
		return 'basic';
	}

	public function get_icon(): string {
		return 'email-alt';
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'placeholder', 'type' => 'text', 'label' => __( 'Placeholder', 'flowforms' ) ],
		];
	}

	public function render_frontend( array $field ): string {
		$id          = esc_attr( $field['id'] ?? '' );
		$req         = ! empty( $field['required'] ) ? 'required' : '';
		$placeholder = esc_attr( $field['placeholder'] ?? '' );
		return '<input type="email" name="' . $id . '" id="ff-field-' . $id . '" class="ff-form__input" placeholder="' . $placeholder . '" ' . $req . ' />';
	}

	public function validate( mixed $value, array $field ): true|string {
		if ( $value === '' || $value === null ) {
			return true;
		}
		if ( ! is_email( $value ) ) {
			return __( 'Please enter a valid email address.', 'flowforms' );
		}
		return true;
	}

	public function sanitize( mixed $value, array $field ): mixed {
		return sanitize_email( (string) $value );
	}
}
