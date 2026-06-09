<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

/**
 * Non-profit donation pledge — image-led cover with mission statement,
 * donation amount selector, donor info, optional message. Warm rose
 * palette, emotional tone.
 */
class NonprofitDonationTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'nonprofit-donation'; }
	public function get_label(): string       { return __( 'Non-profit donation', 'formspress' ); }
	public function get_description(): string { return __( 'Hero image + donation pledge form. Amount selector, donor details, dedication.', 'formspress' ); }
	public function get_category(): string    { return 'nonprofit'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'heart'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'amount',    'type' => 'radio',  'label' => __( 'Donation amount', 'formspress' ), 'required' => true, 'options' => [ '$25', '$50', '$100', '$250', '$500' ] ],
			[ 'id' => 'name',      'type' => 'text',   'label' => __( 'Your name', 'formspress' ),     'required' => true ],
			[ 'id' => 'email',     'type' => 'email',  'label' => __( 'Email', 'formspress' ),         'required' => true ],
			[ 'id' => 'message',   'type' => 'textarea', 'label' => __( 'A message (optional)', 'formspress' ) ],
		];
	}

	public function get_block_markup(): ?string {
		$amounts = [
			[ 'label' => '$25',  'value' => '25'  ],
			[ 'label' => '$50',  'value' => '50'  ],
			[ 'label' => '$100', 'value' => '100' ],
			[ 'label' => '$250', 'value' => '250' ],
			[ 'label' => '$500', 'value' => '500' ],
		];

		$inner = implode( "\n", [
			TB::image( TB::placeholder( '1200x500', 'be123c', 'ffffff' ), __( 'Our mission', 'formspress' ), [ 'radius' => '14px' ] ),
			TB::heading( [
				'text' => __( 'Stand with us', 'formspress' ),
				'level' => 2, 'size' => '32px', 'weight' => '800', 'color' => '#881337',
				'marginBottom' => '8px',
			] ),
			TB::description( [
				'text' => __( '100% of your gift goes to our programs. Every dollar funds direct impact.', 'formspress' ),
				'color' => '#9f1239', 'size' => '15px', 'marginBottom' => '24px',
			] ),
			TB::field_radio(    [ 'fieldId' => 'amount',  'label' => __( 'Donation amount', 'formspress' ), 'required' => true, 'options' => $amounts ] ),
			TB::field_text(     [ 'fieldId' => 'name',    'label' => __( 'Your name', 'formspress' ),  'required' => true ] ),
			TB::field_email(    [ 'fieldId' => 'email',   'label' => __( 'Email', 'formspress' ),      'required' => true ] ),
			TB::field_textarea( [ 'fieldId' => 'message', 'label' => __( 'A message (optional)', 'formspress' ), 'rows' => 3, 'placeholder' => __( 'Tell us why you give…', 'formspress' ) ] ),
			TB::submit_button(  [ 'text' => __( 'Pledge donation', 'formspress' ), 'bg' => '#be123c', 'fg' => '#ffffff', 'full' => true ] ),
		] );

		return TB::group( [
			'inner'   => $inner,
			'bg'      => '#fff7f8',
			'border'  => '#fecdd3',
			'radius'  => '18px',
			'padding' => '56px',
			'maxWidth' => '640px',
		] );
	}
}
