<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class TimeFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'time';
	}

	public function get_label(): string {
		return __( 'Time', 'flowforms' );
	}

	public function get_group(): string {
		return 'advanced';
	}

	public function get_icon(): string {
		return 'clock';
	}

	public function render_frontend( array $field ): string {
		$id  = esc_attr( $field['id'] ?? '' );
		$req = ! empty( $field['required'] ) ? 'required' : '';
		return '<input type="time" name="' . $id . '" id="ff-field-' . $id . '" class="ff-form__input" ' . $req . ' />';
	}
}
