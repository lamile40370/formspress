<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

/**
 * Restaurant reservation — warm cream card with serif heading,
 * date / time / party-size triple, side-by-side first/last name.
 * Designed for restaurant landing pages.
 */
class RestaurantReservationTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'restaurant-reservation'; }
	public function get_label(): string       { return __( 'Restaurant reservation', 'formspress' ); }
	public function get_description(): string { return __( 'Warm cream reservation card — date, time, party size, contact details.', 'formspress' ); }
	public function get_category(): string    { return 'hospitality'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'food'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'first_name', 'type' => 'text',   'label' => __( 'First name', 'formspress' ), 'required' => true ],
			[ 'id' => 'last_name',  'type' => 'text',   'label' => __( 'Last name', 'formspress' ),  'required' => true ],
			[ 'id' => 'email',      'type' => 'email',  'label' => __( 'Email', 'formspress' ),      'required' => true ],
			[ 'id' => 'phone',      'type' => 'text',   'label' => __( 'Phone', 'formspress' ),      'required' => true ],
			[ 'id' => 'date',       'type' => 'text',   'label' => __( 'Preferred date', 'formspress' ), 'required' => true ],
			[ 'id' => 'time',       'type' => 'text',   'label' => __( 'Preferred time', 'formspress' ), 'required' => true ],
			[ 'id' => 'party',      'type' => 'number', 'label' => __( 'Party size', 'formspress' ),  'required' => true ],
			[ 'id' => 'notes',      'type' => 'textarea', 'label' => __( 'Special requests', 'formspress' ) ],
		];
	}

	public function get_block_markup(): ?string {
		$name_row = TB::columns(
			TB::field_text( [ 'fieldId' => 'first_name', 'label' => __( 'First name', 'formspress' ), 'required' => true ] ),
			TB::field_text( [ 'fieldId' => 'last_name',  'label' => __( 'Last name', 'formspress' ),  'required' => true ] ),
			'16px'
		);
		$contact_row = TB::columns(
			TB::field_email( [ 'fieldId' => 'email', 'label' => __( 'Email', 'formspress' ), 'required' => true ] ),
			TB::field_text(  [ 'fieldId' => 'phone', 'label' => __( 'Phone', 'formspress' ), 'required' => true ] ),
			'16px'
		);
		$datetime_row = TB::columns(
			TB::field_text(   [ 'fieldId' => 'date', 'label' => __( 'Preferred date', 'formspress' ), 'required' => true, 'placeholder' => 'YYYY-MM-DD' ] ),
			TB::field_text(   [ 'fieldId' => 'time', 'label' => __( 'Preferred time', 'formspress' ), 'required' => true, 'placeholder' => '19:30' ] ),
			'16px'
		);

		$inner = implode( "\n", [
			TB::heading( [
				'text' => __( 'Book a table', 'formspress' ),
				'level' => 2, 'size' => '32px', 'weight' => '700',
				'color' => '#7f1d1d', 'marginBottom' => '4px',
			] ),
			TB::description( [
				'text'  => __( 'We confirm reservations within a few hours. For parties over 8, please call us directly.', 'formspress' ),
				'color' => '#991b1b', 'size' => '15px', 'marginBottom' => '24px',
			] ),
			$name_row,
			$contact_row,
			$datetime_row,
			TB::field_number( [ 'fieldId' => 'party', 'label' => __( 'Party size', 'formspress' ), 'required' => true, 'min' => 1, 'max' => 20, 'defaultValue' => '2' ] ),
			TB::field_textarea( [ 'fieldId' => 'notes', 'label' => __( 'Special requests', 'formspress' ), 'rows' => 3, 'placeholder' => __( 'Allergies, celebration, seating preference…', 'formspress' ) ] ),
			TB::submit_button( [ 'text' => __( 'Request table', 'formspress' ), 'bg' => '#7f1d1d', 'fg' => '#ffffff' ] ),
		] );

		return TB::group( [
			'inner'   => $inner,
			'bg'      => '#fffafa',
			'border'  => '#fecaca',
			'radius'  => '18px',
			'padding' => '56px',
			'maxWidth' => '680px',
		] );
	}
}
