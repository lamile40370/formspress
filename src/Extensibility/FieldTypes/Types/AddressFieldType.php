<?php

namespace FlowForms\Extensibility\FieldTypes\Types;

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class AddressFieldType extends AbstractFieldType {

	public function get_id(): string {
		return 'address';
	}

	public function get_label(): string {
		return __( 'Address', 'flowforms' );
	}

	public function get_group(): string {
		return 'advanced';
	}

	public function get_icon(): string {
		return 'location';
	}

	public function get_description(): string {
		return __( 'Structured address (street, city, state, zip, country).', 'flowforms' );
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'country_default', 'type' => 'text', 'label' => __( 'Default country (ISO code)', 'flowforms' ), 'placeholder' => 'US' ],
		];
	}

	public function render_frontend( array $field ): string {
		$id              = esc_attr( $field['id'] ?? '' );
		$req             = ! empty( $field['required'] ) ? 'required' : '';
		$country_default = esc_attr( $field['country_default'] ?? '' );
		$countries       = self::get_countries();

		$html  = '<div class="ff-form__address" data-field-id="' . $id . '">';
		$html .= '<input type="text" name="' . $id . '[street]" placeholder="' . esc_attr__( 'Street address', 'flowforms' ) . '" class="ff-form__input ff-form__address-street" ' . $req . ' />';
		$html .= '<div class="ff-form__address-row">';
		$html .= '<input type="text" name="' . $id . '[city]" placeholder="' . esc_attr__( 'City', 'flowforms' ) . '" class="ff-form__input ff-form__address-city" ' . $req . ' />';
		$html .= '<input type="text" name="' . $id . '[state]" placeholder="' . esc_attr__( 'State / Region', 'flowforms' ) . '" class="ff-form__input ff-form__address-state" />';
		$html .= '<input type="text" name="' . $id . '[zip]" placeholder="' . esc_attr__( 'ZIP / Postal code', 'flowforms' ) . '" class="ff-form__input ff-form__address-zip" />';
		$html .= '</div>';
		$html .= '<select name="' . $id . '[country]" class="ff-form__select ff-form__address-country" ' . $req . '>';
		$html .= '<option value="">' . esc_html__( 'Select country…', 'flowforms' ) . '</option>';
		foreach ( $countries as $code => $name ) {
			$selected = ( $code === $country_default ) ? ' selected' : '';
			$html .= '<option value="' . esc_attr( $code ) . '"' . $selected . '>' . esc_html( $name ) . '</option>';
		}
		$html .= '</select>';
		$html .= '</div>';
		return $html;
	}

	public function validate( mixed $value, array $field ): true|string {
		if ( ! empty( $field['required'] ) ) {
			if ( ! is_array( $value ) ) {
				return __( 'Please complete the address.', 'flowforms' );
			}
			if ( empty( $value['street'] ) || empty( $value['city'] ) || empty( $value['country'] ) ) {
				return __( 'Please complete the address (street, city, country).', 'flowforms' );
			}
		}
		return true;
	}

	public function sanitize( mixed $value, array $field ): mixed {
		if ( ! is_array( $value ) ) {
			return '';
		}
		$parts = [
			'street'  => sanitize_text_field( $value['street']  ?? '' ),
			'city'    => sanitize_text_field( $value['city']    ?? '' ),
			'state'   => sanitize_text_field( $value['state']   ?? '' ),
			'zip'     => sanitize_text_field( $value['zip']     ?? '' ),
			'country' => sanitize_text_field( $value['country'] ?? '' ),
		];
		return implode( ', ', array_filter( $parts ) );
	}

	/**
	 * Minimal ISO 3166-1 alpha-2 → name map. Themes/plugins can extend via filter.
	 *
	 * @return array<string, string>
	 */
	private static function get_countries(): array {
		$countries = [
			'US' => 'United States', 'CA' => 'Canada', 'GB' => 'United Kingdom', 'FR' => 'France',
			'DE' => 'Germany', 'ES' => 'Spain', 'IT' => 'Italy', 'NL' => 'Netherlands',
			'BE' => 'Belgium', 'CH' => 'Switzerland', 'AT' => 'Austria', 'IE' => 'Ireland',
			'PT' => 'Portugal', 'SE' => 'Sweden', 'NO' => 'Norway', 'DK' => 'Denmark',
			'FI' => 'Finland', 'PL' => 'Poland', 'AU' => 'Australia', 'NZ' => 'New Zealand',
			'JP' => 'Japan', 'CN' => 'China', 'IN' => 'India', 'BR' => 'Brazil',
			'MX' => 'Mexico', 'AR' => 'Argentina', 'ZA' => 'South Africa', 'AE' => 'United Arab Emirates',
		];
		/** @var array<string, string> $filtered */
		$filtered = apply_filters( 'flowforms_address_countries', $countries );
		return $filtered;
	}
}
