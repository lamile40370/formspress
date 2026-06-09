<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class TextareaFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'textarea';
	}

	public function get_label(): string {
		return __( 'Long Text', 'formspress' );
	}

	public function get_group(): string {
		return 'basic';
	}

	public function get_icon(): string {
		return 'editor-paragraph';
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'placeholder', 'type' => 'text',   'label' => __( 'Placeholder', 'formspress' ) ],
			[ 'key' => 'rows',        'type' => 'number', 'label' => __( 'Rows', 'formspress' ), 'default' => 4, 'min' => 1, 'max' => 20 ],
			[ 'key' => 'max_length',  'type' => 'number', 'label' => __( 'Max length', 'formspress' ), 'min' => 0 ],
		];
	}

	public function render_frontend( array $field ): string {
		$id          = esc_attr( $field['id'] ?? '' );
		$req         = ! empty( $field['required'] ) ? 'required' : '';
		$placeholder = esc_attr( $field['placeholder'] ?? '' );
		return '<textarea name="' . $id . '" id="ff-field-' . $id . '" class="ff-form__textarea" placeholder="' . $placeholder . '" ' . $req . '></textarea>';
	}

	public function sanitize( mixed $value, array $field ): mixed {
		return sanitize_textarea_field( (string) $value );
	}
}
