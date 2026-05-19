<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class OpinionScaleFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'opinion_scale';
	}

	public function get_label(): string {
		return __( 'Opinion Scale', 'flowforms' );
	}

	public function get_group(): string {
		return 'advanced';
	}

	public function get_icon(): string {
		return 'editor-ol';
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'min',       'type' => 'number', 'label' => __( 'Min value', 'flowforms' ), 'default' => 1 ],
			[ 'key' => 'max',       'type' => 'number', 'label' => __( 'Max value', 'flowforms' ), 'default' => 10 ],
			[ 'key' => 'min_label', 'type' => 'text',   'label' => __( 'Low label', 'flowforms' ),  'placeholder' => 'Strongly disagree' ],
			[ 'key' => 'max_label', 'type' => 'text',   'label' => __( 'High label', 'flowforms' ), 'placeholder' => 'Strongly agree' ],
		];
	}

	public function render_frontend( array $field ): string {
		$id   = esc_attr( $field['id'] ?? '' );
		$min  = (int) ( $field['min'] ?? 1 );
		$max  = (int) ( $field['max'] ?? 10 );
		$html = '<div class="ff-form__opinion-scale" data-field-id="' . $id . '">';
		$html .= '<input type="hidden" name="' . $id . '" />';
		$html .= '<div class="ff-form__scale-buttons">';
		for ( $i = $min; $i <= $max; $i++ ) {
			$html .= '<button type="button" class="ff-form__scale-btn" data-value="' . $i . '">' . $i . '</button>';
		}
		$html .= '</div>';
		if ( ! empty( $field['min_label'] ) || ! empty( $field['max_label'] ) ) {
			$html .= '<div class="ff-form__scale-labels"><span>' . esc_html( $field['min_label'] ?? '' ) . '</span><span>' . esc_html( $field['max_label'] ?? '' ) . '</span></div>';
		}
		$html .= '</div>';
		return $html;
	}
}
