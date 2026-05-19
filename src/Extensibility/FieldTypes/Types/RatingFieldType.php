<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class RatingFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'rating';
	}

	public function get_label(): string {
		return __( 'Rating', 'flowforms' );
	}

	public function get_group(): string {
		return 'advanced';
	}

	public function get_icon(): string {
		return 'star-filled';
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'max', 'type' => 'select', 'label' => __( 'Max stars', 'flowforms' ), 'default' => 5,
				'options' => [
					[ 'value' => 3, 'label' => '3' ],
					[ 'value' => 4, 'label' => '4' ],
					[ 'value' => 5, 'label' => '5' ],
					[ 'value' => 6, 'label' => '6' ],
					[ 'value' => 7, 'label' => '7' ],
					[ 'value' => 10, 'label' => '10' ],
				],
			],
		];
	}

	public function render_frontend( array $field ): string {
		$id   = esc_attr( $field['id'] ?? '' );
		$max  = absint( $field['max'] ?? 5 );
		$html = '<div class="ff-form__rating" data-max="' . esc_attr( $max ) . '">';
		$html .= '<input type="hidden" name="' . $id . '" class="ff-rating-value" />';
		for ( $i = 1; $i <= $max; $i++ ) {
			$html .= '<span class="ff-form__star" data-value="' . $i . '">★</span>';
		}
		$html .= '</div>';
		return $html;
	}
}
