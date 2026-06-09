<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

/**
 * Layout-only field that renders its child columns.
 * Children are rendered by the FormRenderer recursively — this
 * method is only called as a stub for non-row contexts.
 */
class RowFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'row';
	}

	public function get_label(): string {
		return __( 'Columns', 'formspress' );
	}

	public function get_group(): string {
		return 'layout';
	}

	public function get_icon(): string {
		return 'columns';
	}

	public function render_frontend( array $field ): string {
		/* FormRenderer handles row rendering specially because it must
		   recursively render child columns and fields. */
		return '';
	}

	public function is_storable(): bool {
		return false;
	}
}
