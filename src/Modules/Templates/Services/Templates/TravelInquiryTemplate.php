<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

class TravelInquiryTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'travel-inquiry'; }
	public function get_label(): string       { return __( 'Travel inquiry', 'formspress' ); }
	public function get_description(): string { return __( 'Concierge travel request with destination, dates, party size and trip style.', 'formspress' ); }
	public function get_category(): string    { return 'hospitality'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'location-alt'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'name', 'type' => 'text', 'label' => __( 'Name', 'formspress' ), 'required' => true ],
			[ 'id' => 'email', 'type' => 'email', 'label' => __( 'Email', 'formspress' ), 'required' => true ],
			[ 'id' => 'destination', 'type' => 'text', 'label' => __( 'Destination', 'formspress' ), 'required' => true ],
			[ 'id' => 'dates', 'type' => 'text', 'label' => __( 'Travel dates', 'formspress' ) ],
			[ 'id' => 'travelers', 'type' => 'number', 'label' => __( 'Travelers', 'formspress' ) ],
			[ 'id' => 'style', 'type' => 'select', 'label' => __( 'Trip style', 'formspress' ), 'options' => [ __( 'Relaxed', 'formspress' ), __( 'Adventure', 'formspress' ), __( 'Family', 'formspress' ), __( 'Luxury', 'formspress' ) ] ],
			[ 'id' => 'notes', 'type' => 'textarea', 'label' => __( 'Dream itinerary', 'formspress' ) ],
		];
	}

	public function get_block_markup(): ?string {
		$styles = [
			[ 'label' => __( 'Relaxed', 'formspress' ),  'value' => 'relaxed' ],
			[ 'label' => __( 'Adventure', 'formspress' ), 'value' => 'adventure' ],
			[ 'label' => __( 'Family', 'formspress' ),   'value' => 'family' ],
			[ 'label' => __( 'Luxury', 'formspress' ),   'value' => 'luxury' ],
		];

		$contact_row = TB::columns(
			TB::field_text( [ 'fieldId' => 'name', 'label' => __( 'Name', 'formspress' ), 'required' => true ] ),
			TB::field_email( [ 'fieldId' => 'email', 'label' => __( 'Email', 'formspress' ), 'required' => true ] ),
			'16px'
		);
		$trip_row = TB::columns(
			TB::field_text( [ 'fieldId' => 'destination', 'label' => __( 'Destination', 'formspress' ), 'required' => true, 'placeholder' => __( 'Lisbon, Kyoto, Patagonia...', 'formspress' ) ] ),
			TB::field_text( [ 'fieldId' => 'dates', 'label' => __( 'Travel dates', 'formspress' ), 'placeholder' => __( 'Flexible or exact dates', 'formspress' ) ] ),
			'16px'
		);
		$details_row = TB::columns(
			TB::field_number( [ 'fieldId' => 'travelers', 'label' => __( 'Travelers', 'formspress' ), 'defaultValue' => '2' ] ),
			TB::field_select( [ 'fieldId' => 'style', 'label' => __( 'Trip style', 'formspress' ), 'options' => $styles ] ),
			'16px'
		);

		$left = implode( "\n", [
			TB::image( TB::placeholder( '900x1100', '0891b2', 'ffffff' ), __( 'Travel destination', 'formspress' ), [ 'radius' => '22px' ] ),
		] );
		$right = implode( "\n", [
			TB::heading( [
				'text' => __( 'Plan a tailored escape', 'formspress' ),
				'level' => 2, 'size' => '32px', 'weight' => '800', 'color' => '#164e63',
				'marginBottom' => '8px',
			] ),
			TB::description( [
				'text' => __( 'Share the destination, mood and practical details. We will propose an itinerary that fits.', 'formspress' ),
				'color' => '#155e75', 'size' => '15px', 'marginBottom' => '24px',
			] ),
			$contact_row,
			$trip_row,
			$details_row,
			TB::field_textarea( [ 'fieldId' => 'notes', 'label' => __( 'Dream itinerary', 'formspress' ), 'rows' => 4 ] ),
			TB::submit_button( [ 'text' => __( 'Request itinerary', 'formspress' ), 'bg' => '#0891b2', 'fg' => '#ffffff' ] ),
		] );

		return TB::group( [
			'inner' => TB::columns( $left, $right, '42px' ),
			'bg' => '#ecfeff',
			'border' => '#a5f3fc',
			'radius' => '24px',
			'padding' => '44px',
			'maxWidth' => '980px',
		] );
	}
}
