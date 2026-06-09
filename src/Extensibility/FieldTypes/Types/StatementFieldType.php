<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class StatementFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'statement';
	}

	public function get_label(): string {
		return __( 'Statement', 'formspress' );
	}

	public function get_group(): string {
		return 'layout';
	}

	public function get_icon(): string {
		return 'format-quote';
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'content', 'type' => 'textarea', 'label' => __( 'Statement content', 'formspress' ), 'rows' => 3 ],
		];
	}

	public function render_frontend( array $field ): string {
		return '<div class="ff-form__statement">' . esc_html( $field['content'] ?? '' ) . '</div>';
	}

	public function is_storable(): bool {
		return false;
	}
}
