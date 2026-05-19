<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class TextFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'text';
	}

	public function get_label(): string {
		return __( 'Text', 'flowforms' );
	}

	public function get_group(): string {
		return 'basic';
	}

	public function get_icon(): string {
		return 'editor-insertmore';
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'placeholder', 'type' => 'text',   'label' => __( 'Placeholder', 'flowforms' ) ],
			[ 'key' => 'max_length',  'type' => 'number', 'label' => __( 'Max length', 'flowforms' ), 'min' => 0 ],
		];
	}

	public function render_frontend( array $field ): string {
		$id       = esc_attr( $field['id'] ?? '' );
		$req      = ! empty( $field['required'] ) ? 'required' : '';
		$placeholder = esc_attr( $field['placeholder'] ?? '' );
		return '<input type="text" name="' . $id . '" id="ff-field-' . $id . '" class="ff-form__input" placeholder="' . $placeholder . '" ' . $req . ' />';
	}
}
