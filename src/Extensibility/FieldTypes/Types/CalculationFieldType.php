<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

/**
 * Calculation field — read-only, displays a formula-computed value at
 * runtime. The actual value submitted on the wire is recomputed server-side
 * by EntryProcessor (never trust the hidden input).
 */
class CalculationFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'calculation';
	}

	public function get_label(): string {
		return __( 'Calculation', 'flowforms' );
	}

	public function get_group(): string {
		return 'advanced';
	}

	public function get_icon(): string {
		return 'calculator';
	}

	public function get_description(): string {
		return __( 'Display a value computed from other fields.', 'flowforms' );
	}

	public function get_settings_schema(): array {
		return [
			[
				'key'         => 'formula',
				'type'        => 'text',
				'label'       => __( 'Formula', 'flowforms' ),
				'help'        => __( 'Use {field:id}. Operators + - * / %, functions min, max, round, if, sum, avg, abs, floor, ceil.', 'flowforms' ),
				'placeholder' => '{field:qty} * {field:price}',
				'default'     => '',
				'required'    => true,
			],
			[
				'key'     => 'format',
				'type'    => 'select',
				'label'   => __( 'Format', 'flowforms' ),
				'default' => 'number',
				'options' => [
					[ 'value' => 'number',   'label' => __( 'Number',   'flowforms' ) ],
					[ 'value' => 'currency', 'label' => __( 'Currency', 'flowforms' ) ],
					[ 'value' => 'percent',  'label' => __( 'Percent',  'flowforms' ) ],
					[ 'value' => 'integer',  'label' => __( 'Integer',  'flowforms' ) ],
				],
			],
			[
				'key'     => 'currency_code',
				'type'    => 'text',
				'label'   => __( 'Currency code', 'flowforms' ),
				'default' => 'EUR',
				'help'    => __( 'Shown only when format is "currency".', 'flowforms' ),
			],
			[
				'key'     => 'decimals',
				'type'    => 'number',
				'label'   => __( 'Decimals', 'flowforms' ),
				'default' => 2,
				'min'     => 0,
				'max'     => 8,
			],
			[
				'key'     => 'show_label',
				'type'    => 'toggle',
				'label'   => __( 'Show label', 'flowforms' ),
				'default' => true,
			],
		];
	}

	public function render_frontend( array $field ): string {
		$id            = esc_attr( $field['id'] ?? '' );
		$formula       = (string) ( $field['formula'] ?? '' );
		$format        = (string) ( $field['format'] ?? 'number' );
		$decimals      = isset( $field['decimals'] ) ? (int) $field['decimals'] : 2;
		$currency_code = (string) ( $field['currency_code'] ?? 'EUR' );

		return sprintf(
			'<div class="ff-form__calc" data-field-id="%1$s" data-formula="%2$s" data-format="%3$s" data-decimals="%4$d" data-currency="%5$s" aria-live="polite">0</div>'
			. '<input type="hidden" name="%1$s" value="0" data-formula-result />',
			$id,
			esc_attr( $formula ),
			esc_attr( $format ),
			$decimals,
			esc_attr( $currency_code )
		);
	}

	/**
	 * Calculation fields are always submitted as a single number. We accept
	 * whatever the client posted (just stringify it cleanly); the EntryProcessor
	 * will overwrite this with the trusted server-computed value.
	 */
	public function sanitize( mixed $value, array $field ): mixed {
		return is_numeric( $value ) ? (string) floatval( $value ) : '0';
	}

	public function validate( mixed $value, array $field ): true|string {
		return true;
	}
}
