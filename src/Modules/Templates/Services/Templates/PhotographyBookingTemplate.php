<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

/**
 * Photography booking — moody dark card with serif vibe, session type
 * selector, location, message. Designed for portrait / wedding /
 * commercial photographer landing pages.
 */
class PhotographyBookingTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'photography-booking'; }
	public function get_label(): string       { return __( 'Photography booking', 'formspress' ); }
	public function get_description(): string { return __( 'Moody dark card — session type, date, location, project brief.', 'formspress' ); }
	public function get_category(): string    { return 'creative'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'camera'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'name',     'type' => 'text',    'label' => __( 'Your name', 'formspress' ), 'required' => true ],
			[ 'id' => 'email',    'type' => 'email',   'label' => __( 'Email', 'formspress' ),     'required' => true ],
			[ 'id' => 'session',  'type' => 'select',  'label' => __( 'Session type', 'formspress' ), 'required' => true, 'options' => [ __( 'Portrait', 'formspress' ), __( 'Wedding', 'formspress' ), __( 'Event', 'formspress' ), __( 'Commercial', 'formspress' ), __( 'Other', 'formspress' ) ] ],
			[ 'id' => 'date',     'type' => 'text',    'label' => __( 'Preferred date', 'formspress' ) ],
			[ 'id' => 'location', 'type' => 'text',    'label' => __( 'Location', 'formspress' ) ],
			[ 'id' => 'brief',    'type' => 'textarea', 'label' => __( 'Tell me about the shoot', 'formspress' ), 'required' => true ],
		];
	}

	public function get_block_markup(): ?string {
		$sessions = [
			[ 'label' => __( 'Portrait', 'formspress' ),   'value' => 'portrait' ],
			[ 'label' => __( 'Wedding', 'formspress' ),    'value' => 'wedding' ],
			[ 'label' => __( 'Event', 'formspress' ),      'value' => 'event' ],
			[ 'label' => __( 'Commercial', 'formspress' ), 'value' => 'commercial' ],
			[ 'label' => __( 'Other', 'formspress' ),      'value' => 'other' ],
		];

		$contact_row = TB::columns(
			TB::field_text(  [ 'fieldId' => 'name',  'label' => __( 'Your name', 'formspress' ), 'required' => true ] ),
			TB::field_email( [ 'fieldId' => 'email', 'label' => __( 'Email', 'formspress' ),     'required' => true ] ),
			'16px'
		);
		$logistics_row = TB::columns(
			TB::field_text( [ 'fieldId' => 'date',     'label' => __( 'Preferred date', 'formspress' ), 'placeholder' => 'YYYY-MM-DD' ] ),
			TB::field_text( [ 'fieldId' => 'location', 'label' => __( 'Location', 'formspress' ), 'placeholder' => __( 'City, country', 'formspress' ) ] ),
			'16px'
		);

		$inner = implode( "\n", [
			TB::heading( [
				'text' => __( 'Let\'s create something', 'formspress' ),
				'level' => 2, 'size' => '34px', 'weight' => '300', 'color' => '#fafaf9',
				'align' => 'center', 'marginBottom' => '8px',
			] ),
			TB::description( [
				'text' => __( 'Tell me about your project. I respond within 48 hours with availability and pricing.', 'formspress' ),
				'color' => '#a8a29e', 'size' => '15px', 'align' => 'center', 'marginBottom' => '32px',
			] ),
			$contact_row,
			TB::field_select( [ 'fieldId' => 'session', 'label' => __( 'Session type', 'formspress' ), 'required' => true, 'options' => $sessions ] ),
			$logistics_row,
			TB::field_textarea( [ 'fieldId' => 'brief', 'label' => __( 'Tell me about the shoot', 'formspress' ), 'rows' => 5, 'required' => true ] ),
			TB::submit_button( [ 'text' => __( 'Request quote', 'formspress' ), 'bg' => '#fafaf9', 'fg' => '#1c1917', 'full' => true ] ),
		] );

		return TB::group( [
			'inner'   => $inner,
			'bg'      => '#18181b',
			'fg'      => '#fafaf9',
			'border'  => '#3f3f46',
			'radius'  => '20px',
			'padding' => '64px',
			'maxWidth' => '660px',
		] );
	}
}
