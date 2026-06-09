<?php

namespace FlowForms\Extensibility\Validators\Types;

use FlowForms\Extensibility\Validators\AbstractValidator;

class RequiredValidator extends AbstractValidator {

	public function get_id(): string {
		return 'required';
	}

	public function get_label(): string {
		return __( 'Required', 'formspress' );
	}

	public function get_description(): string {
		return __( 'Field must not be empty.', 'formspress' );
	}

	public function validate( mixed $value, array $config, array $field ): true|string {
		if ( is_array( $value ) ) {
			$empty = empty( array_filter( $value, fn( $v ) => $v !== '' && $v !== null ) );
		} else {
			$empty = ( $value === '' || $value === null );
		}
		if ( $empty ) {
			return sprintf(
				/* translators: %s is the field label */
				__( '%s is required.', 'formspress' ),
				$field['label'] ?? ( $field['id'] ?? 'Field' )
			);
		}
		return true;
	}
}
