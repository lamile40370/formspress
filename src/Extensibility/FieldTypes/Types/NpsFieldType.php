<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class NpsFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'nps';
	}

	public function get_label(): string {
		return __( 'NPS', 'flowforms' );
	}

	public function get_group(): string {
		return 'advanced';
	}

	public function get_icon(): string {
		return 'chart-bar';
	}

	public function render_frontend( array $field ): string {
		$id   = esc_attr( $field['id'] ?? '' );
		$html = '<div class="ff-form__nps" data-field-id="' . $id . '">';
		$html .= '<input type="hidden" name="' . $id . '" />';
		$html .= '<div class="ff-form__nps-buttons">';
		for ( $i = 0; $i <= 10; $i++ ) {
			$html .= '<button type="button" class="ff-form__nps-btn" data-value="' . $i . '">' . $i . '</button>';
		}
		$html .= '</div>';
		$html .= '<div class="ff-form__nps-labels"><span>' . esc_html__( 'Not likely', 'flowforms' ) . '</span><span>' . esc_html__( 'Very likely', 'flowforms' ) . '</span></div>';
		$html .= '</div>';
		return $html;
	}
}
