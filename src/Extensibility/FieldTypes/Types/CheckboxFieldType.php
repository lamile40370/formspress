<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class CheckboxFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'checkbox';
	}

	public function get_label(): string {
		return __( 'Checkbox', 'flowforms' );
	}

	public function get_group(): string {
		return 'choice';
	}

	public function get_icon(): string {
		return 'yes-alt';
	}

	public function render_frontend( array $field ): string {
		$id   = esc_attr( $field['id'] ?? '' );
		$html = '<div class="ff-form__choices">';
		foreach ( $field['options'] ?? [] as $opt ) {
			$html .= '<label class="ff-form__choice"><input type="checkbox" name="' . $id . '[]" value="' . esc_attr( $opt ) . '" /> ' . esc_html( $opt ) . '</label>';
		}
		$html .= '</div>';
		return $html;
	}

	public function sanitize( mixed $value, array $field ): mixed {
		if ( is_array( $value ) ) {
			return implode( ', ', array_map( 'sanitize_text_field', $value ) );
		}
		return sanitize_text_field( (string) $value );
	}
}
