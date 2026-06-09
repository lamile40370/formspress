<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class SectionFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'section';
	}

	public function get_label(): string {
		return __( 'Section', 'formspress' );
	}

	public function get_group(): string {
		return 'layout';
	}

	public function get_icon(): string {
		return 'minus';
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'content', 'type' => 'textarea', 'label' => __( 'Section description', 'formspress' ), 'rows' => 3 ],
		];
	}

	public function render_frontend( array $field ): string {
		$html = '<div class="ff-form__section">';
		$html .= '<p class="ff-form__section-title">' . esc_html( $field['label'] ?? '' ) . '</p>';
		if ( ! empty( $field['content'] ) ) {
			$html .= '<p>' . esc_html( $field['content'] ) . '</p>';
		}
		$html .= '</div>';
		return $html;
	}

	public function is_storable(): bool {
		return false;
	}
}
