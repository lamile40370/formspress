<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class ProductFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'product';
	}

	public function get_label(): string {
		return __( 'Product', 'formspress' );
	}

	public function get_group(): string {
		return 'payment';
	}

	public function get_icon(): string {
		return 'cart';
	}

	public function get_description(): string {
		return __( 'Checkout product with quantity and price.', 'formspress' );
	}

	public function render_frontend( array $field ): string {
		$id    = esc_attr( $field['id'] ?? '' );
		$min   = max( 0, (float) ( $field['min_quantity'] ?? 0 ) );
		$max   = $field['max_quantity'] ?? null;
		$step  = max( 0.0001, (float) ( $field['step_quantity'] ?? 1 ) );
		$value = is_numeric( $field['default'] ?? null ) ? (float) $field['default'] : $min;
		$value = max( $min, $value );
		$max_attr = null === $max || '' === $max ? '' : ' max="' . esc_attr( (float) $max ) . '"';

		return '<input type="number" name="' . $id . '" id="ff-field-' . $id . '" class="ff-form__input ff-form__product-quantity" value="' . esc_attr( $value ) . '" min="' . esc_attr( $min ) . '"' . $max_attr . ' step="' . esc_attr( $step ) . '" />';
	}

	public function validate( mixed $value, array $field ): true|string {
		if ( '' === $value || null === $value ) {
			$value = 0;
		}

		if ( ! is_numeric( $value ) ) {
			return __( 'Please enter a valid quantity.', 'formspress' );
		}

		$quantity = (float) $value;
		$min      = max( 0, (float) ( $field['min_quantity'] ?? 0 ) );
		$max      = $field['max_quantity'] ?? null;

		if ( $quantity < $min ) {
			return sprintf(
				/* translators: %s: minimum quantity. */
				__( 'Minimum quantity is %s.', 'formspress' ),
				(string) $min
			);
		}

		if ( null !== $max && '' !== $max && $quantity > (float) $max ) {
			return sprintf(
				/* translators: %s: maximum quantity. */
				__( 'Maximum quantity is %s.', 'formspress' ),
				(string) (float) $max
			);
		}

		return true;
	}

	public function sanitize( mixed $value, array $field ): mixed {
		$quantity = is_numeric( $value ) ? (float) $value : 0.0;
		$quantity = max( 0.0, $quantity );
		return rtrim( rtrim( number_format( $quantity, 4, '.', '' ), '0' ), '.' ) ?: '0';
	}
}
