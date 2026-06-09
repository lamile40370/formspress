<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class DateFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'date';
	}

	public function get_label(): string {
		return __( 'Date', 'formspress' );
	}

	public function get_group(): string {
		return 'advanced';
	}

	public function get_icon(): string {
		return 'calendar';
	}

	public function render_frontend( array $field ): string {
		$id  = esc_attr( $field['id'] ?? '' );
		$req = ! empty( $field['required'] ) ? 'required' : '';
		return '<input type="date" name="' . $id . '" id="ff-field-' . $id . '" class="ff-form__input" ' . $req . ' />';
	}
}
