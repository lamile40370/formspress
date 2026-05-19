<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class UrlFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'url';
	}

	public function get_label(): string {
		return __( 'URL', 'flowforms' );
	}

	public function get_group(): string {
		return 'basic';
	}

	public function get_icon(): string {
		return 'admin-links';
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
		return '<input type="url" name="' . $id . '" id="ff-field-' . $id . '" class="ff-form__input" placeholder="' . $placeholder . '" ' . $req . ' />';
	}

	public function validate( mixed $value, array $field ): true|string {
		if ( $value === '' || $value === null ) {
			return true;
		}
		if ( ! filter_var( $value, FILTER_VALIDATE_URL ) ) {
			return __( 'Please enter a valid URL.', 'flowforms' );
		}
		return true;
	}

	public function sanitize( mixed $value, array $field ): mixed {
		return esc_url_raw( (string) $value );
	}
}
