<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class FileFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'file';
	}

	public function get_label(): string {
		return __( 'File Upload', 'flowforms' );
	}

	public function get_group(): string {
		return 'advanced';
	}

	public function get_icon(): string {
		return 'upload';
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'accept',     'type' => 'text',   'label' => __( 'Accepted file types', 'flowforms' ), 'placeholder' => 'image/*,.pdf', 'help' => __( 'Comma-separated MIME types or extensions.', 'flowforms' ) ],
			[ 'key' => 'max_size',   'type' => 'number', 'label' => __( 'Max file size (MB)', 'flowforms' ), 'default' => 5, 'min' => 1 ],
		];
	}

	public function render_frontend( array $field ): string {
		$id     = esc_attr( $field['id'] ?? '' );
		$req    = ! empty( $field['required'] ) ? 'required' : '';
		$accept = ! empty( $field['accept'] ) ? ' accept="' . esc_attr( $field['accept'] ) . '"' : '';
		return '<input type="file" name="' . $id . '" id="ff-field-' . $id . '" class="ff-form__input"' . $accept . ' ' . $req . ' />';
	}
}
