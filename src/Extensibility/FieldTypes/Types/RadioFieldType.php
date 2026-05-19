<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class RadioFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'radio';
	}

	public function get_label(): string {
		return __( 'Radio', 'flowforms' );
	}

	public function get_group(): string {
		return 'choice';
	}

	public function get_icon(): string {
		return 'marker';
	}

	public function render_frontend( array $field ): string {
		$id       = esc_attr( $field['id'] ?? '' );
		$required = ! empty( $field['required'] );
		$html     = '<div class="ff-form__choices" role="radiogroup">';
		foreach ( $field['options'] ?? [] as $i => $opt ) {
			$req = ( 0 === $i && $required ) ? 'required' : '';
			$html .= '<label class="ff-form__choice"><input type="radio" name="' . $id . '" value="' . esc_attr( $opt ) . '" ' . $req . ' /> ' . esc_html( $opt ) . '</label>';
		}
		$html .= '</div>';
		return $html;
	}
}
