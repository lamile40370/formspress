<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class TotalFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'total';
	}

	public function get_label(): string {
		return __( 'Total', 'formspress' );
	}

	public function get_group(): string {
		return 'payment';
	}

	public function get_icon(): string {
		return 'receipt';
	}

	public function get_description(): string {
		return __( 'Computed checkout total.', 'formspress' );
	}

	public function render_frontend( array $field ): string {
		$id = esc_attr( $field['id'] ?? 'total' );
		return '<input type="hidden" name="' . $id . '" id="ff-field-' . $id . '" value="0" />';
	}

	public function validate( mixed $value, array $field ): true|string {
		return true;
	}

	public function sanitize( mixed $value, array $field ): mixed {
		$total = is_numeric( $value ) ? (float) $value : 0.0;
		return number_format( max( 0.0, $total ), 2, '.', '' );
	}
}
