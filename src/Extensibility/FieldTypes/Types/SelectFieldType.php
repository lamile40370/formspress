<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class SelectFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'select';
	}

	public function get_label(): string {
		return __( 'Dropdown', 'flowforms' );
	}

	public function get_group(): string {
		return 'choice';
	}

	public function get_icon(): string {
		return 'menu';
	}

	public function render_frontend( array $field ): string {
		$id   = esc_attr( $field['id'] ?? '' );
		$req  = ! empty( $field['required'] ) ? 'required' : '';
		$opts = '<option value="">' . esc_html__( 'Select…', 'flowforms' ) . '</option>';
		foreach ( $field['options'] ?? [] as $opt ) {
			$opts .= '<option value="' . esc_attr( $opt ) . '">' . esc_html( $opt ) . '</option>';
		}
		return '<select name="' . $id . '" id="ff-field-' . $id . '" class="ff-form__select" ' . $req . '>' . $opts . '</select>';
	}
}
