<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class YesNoFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'yes_no';
	}

	public function get_label(): string {
		return __( 'Yes / No', 'flowforms' );
	}

	public function get_group(): string {
		return 'choice';
	}

	public function get_icon(): string {
		return 'yes';
	}

	public function render_frontend( array $field ): string {
		$id       = esc_attr( $field['id'] ?? '' );
		$required = ! empty( $field['required'] );
		$req      = $required ? 'required' : '';

		return '<div class="ff-form__choices" role="radiogroup">'
			. '<label class="ff-form__choice"><input type="radio" name="' . $id . '" value="yes" ' . $req . ' /> ' . esc_html__( 'Yes', 'flowforms' ) . '</label>'
			. '<label class="ff-form__choice"><input type="radio" name="' . $id . '" value="no" /> ' . esc_html__( 'No', 'flowforms' ) . '</label>'
			. '</div>';
	}
}
