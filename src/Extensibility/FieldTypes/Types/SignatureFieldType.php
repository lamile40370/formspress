<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class SignatureFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'signature';
	}

	public function get_label(): string {
		return __( 'Signature', 'flowforms' );
	}

	public function get_group(): string {
		return 'advanced';
	}

	public function get_icon(): string {
		return 'edit';
	}

	public function get_description(): string {
		return __( 'Capture a hand-drawn signature as a base64 PNG.', 'flowforms' );
	}

	public function get_settings_schema(): array {
		return [];
	}

	public function render_frontend( array $field ): string {
		$id  = esc_attr( $field['id'] ?? '' );
		$req = ! empty( $field['required'] ) ? '1' : '0';
		$html  = '<div class="ff-form__signature" data-field-id="' . $id . '" data-required="' . $req . '">';
		$html .= '<canvas class="ff-form__signature-canvas" width="500" height="180" aria-label="' . esc_attr__( 'Signature drawing area', 'flowforms' ) . '"></canvas>';
		$html .= '<input type="hidden" name="' . $id . '" class="ff-form__signature-value" />';
		$html .= '<button type="button" class="ff-form__signature-clear">' . esc_html__( 'Clear', 'flowforms' ) . '</button>';
		$html .= '</div>';
		return $html;
	}

	public function validate( mixed $value, array $field ): true|string {
		if ( ! empty( $field['required'] ) && ( $value === '' || $value === null ) ) {
			return __( 'Please provide a signature.', 'flowforms' );
		}
		if ( $value && ! str_starts_with( (string) $value, 'data:image/' ) ) {
			return __( 'Invalid signature data.', 'flowforms' );
		}
		return true;
	}

	public function sanitize( mixed $value, array $field ): mixed {
		$value = (string) $value;
		if ( $value === '' ) {
			return '';
		}
		/* Only allow base64 PNG/JPG data URLs. */
		if ( preg_match( '/^data:image\/(png|jpeg);base64,[A-Za-z0-9+\/=]+$/', $value ) ) {
			return $value;
		}
		return '';
	}
}
