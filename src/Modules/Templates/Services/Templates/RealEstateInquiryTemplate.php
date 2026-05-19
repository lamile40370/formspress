<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

/**
 * Real estate inquiry — split layout with property image on the left
 * and inquiry form on the right. Demonstrates `core/columns` + a
 * property hero shot via placehold.co.
 */
class RealEstateInquiryTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'real-estate-inquiry'; }
	public function get_label(): string       { return __( 'Real estate inquiry', 'flowforms' ); }
	public function get_description(): string { return __( 'Property image on the left + agent contact form on the right. Two-column layout.', 'flowforms' ); }
	public function get_category(): string    { return 'real-estate'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'admin-home'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'name',     'type' => 'text',     'label' => __( 'Your name', 'flowforms' ), 'required' => true ],
			[ 'id' => 'email',    'type' => 'email',    'label' => __( 'Email', 'flowforms' ),     'required' => true ],
			[ 'id' => 'phone',    'type' => 'text',     'label' => __( 'Phone', 'flowforms' ) ],
			[ 'id' => 'timeline', 'type' => 'select',   'label' => __( 'When would you move?', 'flowforms' ), 'options' => [ __( 'ASAP', 'flowforms' ), __( '1-3 months', 'flowforms' ), __( '3-6 months', 'flowforms' ), __( '6+ months', 'flowforms' ) ] ],
			[ 'id' => 'message',  'type' => 'textarea', 'label' => __( 'Tell us what you are looking for', 'flowforms' ), 'required' => true ],
		];
	}

	public function get_block_markup(): ?string {
		$timelines = [
			[ 'label' => __( 'ASAP', 'flowforms' ),         'value' => 'asap' ],
			[ 'label' => __( '1-3 months', 'flowforms' ),   'value' => '1-3' ],
			[ 'label' => __( '3-6 months', 'flowforms' ),   'value' => '3-6' ],
			[ 'label' => __( '6+ months', 'flowforms' ),    'value' => '6plus' ],
		];

		$left = implode( "\n", [
			TB::image( TB::placeholder( '900x1100', '1f2937', 'ffffff' ), __( 'Property photo', 'flowforms' ), [ 'radius' => '14px' ] ),
		] );

		$right = implode( "\n", [
			TB::heading( [
				'text' => __( 'Interested in this property?', 'flowforms' ),
				'level' => 2, 'size' => '30px', 'weight' => '800', 'color' => '#0f172a',
			] ),
			TB::description( [
				'text' => __( 'Schedule a viewing or ask anything — your agent will get back to you within the hour.', 'flowforms' ),
				'color' => '#475569', 'size' => '15px', 'marginBottom' => '24px',
			] ),
			TB::field_text(     [ 'fieldId' => 'name',     'label' => __( 'Your name', 'flowforms' ), 'required' => true ] ),
			TB::field_email(    [ 'fieldId' => 'email',    'label' => __( 'Email', 'flowforms' ),     'required' => true ] ),
			TB::field_text(     [ 'fieldId' => 'phone',    'label' => __( 'Phone', 'flowforms' ),     'placeholder' => '+1 (555) 123-4567' ] ),
			TB::field_select(   [ 'fieldId' => 'timeline', 'label' => __( 'When would you move?', 'flowforms' ), 'options' => $timelines ] ),
			TB::field_textarea( [ 'fieldId' => 'message',  'label' => __( 'Tell us what you are looking for', 'flowforms' ), 'rows' => 4, 'required' => true ] ),
			TB::submit_button(  [ 'text' => __( 'Contact agent', 'flowforms' ), 'bg' => '#0f172a', 'fg' => '#ffffff', 'full' => true ] ),
		] );

		return TB::group( [
			'inner'    => TB::columns( $left, $right, '48px' ),
			'bg'       => '#f8fafc',
			'border'   => '#cbd5e1',
			'radius'   => '18px',
			'padding'  => '56px',
			'maxWidth' => '960px',
		] );
	}
}
