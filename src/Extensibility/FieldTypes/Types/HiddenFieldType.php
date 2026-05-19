<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class HiddenFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'hidden';
	}

	public function get_label(): string {
		return __( 'Hidden', 'flowforms' );
	}

	public function get_group(): string {
		return 'advanced';
	}

	public function get_icon(): string {
		return 'hidden';
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'default_value', 'type' => 'text', 'label' => __( 'Value', 'flowforms' ), 'help' => __( 'Supports {user_email}, {user_id}, {site_url}', 'flowforms' ) ],
		];
	}

	public function render_frontend( array $field ): string {
		$id    = esc_attr( $field['id'] ?? '' );
		$value = esc_attr( $field['default_value'] ?? '' );
		return '<input type="hidden" name="' . $id . '" value="' . $value . '" />';
	}
}
