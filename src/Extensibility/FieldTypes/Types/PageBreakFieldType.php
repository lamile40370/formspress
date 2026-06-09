<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class PageBreakFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'page_break';
	}

	public function get_label(): string {
		return __( 'Page Break', 'formspress' );
	}

	public function get_group(): string {
		return 'layout';
	}

	public function get_icon(): string {
		return 'controls-pause';
	}

	public function render_frontend( array $field ): string {
		return '<hr class="ff-form__page-break" />';
	}

	public function is_storable(): bool {
		return false;
	}
}
