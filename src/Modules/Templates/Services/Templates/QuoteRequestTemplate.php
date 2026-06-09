<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

/**
 * Quote request — B2B / sales-qualified lead capture. Light-grey card,
 * structured fields (service, budget, brief), indigo accent submit.
 * Designed for landing pages where the goal is "get me a real
 * conversation, not a casual contact".
 */
class QuoteRequestTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'quote-request'; }
	public function get_label(): string       { return __( 'Quote request', 'formspress' ); }
	public function get_description(): string { return __( 'B2B lead capture — service type, budget, project brief. Indigo accent.', 'formspress' ); }
	public function get_category(): string    { return 'lead-gen'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'analytics'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'full_name', 'type' => 'text',     'label' => __( 'Full name', 'formspress' ),  'required' => true ],
			[ 'id' => 'email',     'type' => 'email',    'label' => __( 'Work email', 'formspress' ), 'required' => true ],
			[ 'id' => 'company',   'type' => 'text',     'label' => __( 'Company', 'formspress' ) ],
			[ 'id' => 'service',   'type' => 'select',   'label' => __( 'Service needed', 'formspress' ), 'required' => true, 'options' => [ __( 'Design', 'formspress' ), __( 'Development', 'formspress' ), __( 'Consulting', 'formspress' ), __( 'Other', 'formspress' ) ] ],
			[ 'id' => 'budget',    'type' => 'select',   'label' => __( 'Estimated budget', 'formspress' ), 'options' => [ '< $5k', '$5k – $20k', '$20k – $100k', '> $100k' ] ],
			[ 'id' => 'brief',     'type' => 'textarea', 'label' => __( 'Tell us about the project', 'formspress' ), 'required' => true ],
		];
	}

	public function get_actions(): array {
		return [
			[
				'type'     => 'email',
				'enabled'  => true,
				'to'       => get_option( 'admin_email', '' ),
				'subject'  => sprintf( __( 'New quote request from %s', 'formspress' ), '{field:full_name}' ),
				'body'     => '',
				'reply_to' => '{field:email}',
			],
		];
	}

	public function get_block_markup(): ?string {
		$services = [
			[ 'label' => __( 'Design', 'formspress' ),      'value' => 'design' ],
			[ 'label' => __( 'Development', 'formspress' ), 'value' => 'development' ],
			[ 'label' => __( 'Consulting', 'formspress' ),  'value' => 'consulting' ],
			[ 'label' => __( 'Other', 'formspress' ),       'value' => 'other' ],
		];
		$budgets = [
			[ 'label' => '< $5k',         'value' => 'lt5k' ],
			[ 'label' => '$5k – $20k',    'value' => '5to20' ],
			[ 'label' => '$20k – $100k',  'value' => '20to100' ],
			[ 'label' => '> $100k',       'value' => 'gt100' ],
		];

		// Side-by-side name + email.
		$identity_row = TB::columns(
			TB::field_text(  [ 'fieldId' => 'full_name', 'label' => __( 'Full name', 'formspress' ),  'required' => true, 'placeholder' => __( 'Jane Doe', 'formspress' ) ] ),
			TB::field_email( [ 'fieldId' => 'email',     'label' => __( 'Work email', 'formspress' ), 'required' => true, 'placeholder' => 'jane@company.com' ] ),
			'16px'
		);
		$service_row = TB::columns(
			TB::field_select( [ 'fieldId' => 'service', 'label' => __( 'Service needed', 'formspress' ),   'required' => true, 'options' => $services ] ),
			TB::field_select( [ 'fieldId' => 'budget',  'label' => __( 'Estimated budget', 'formspress' ), 'options' => $budgets ] ),
			'16px'
		);

		$intro = TB::group( [
			'inner' => implode( "\n", [
				TB::heading( [
					'text'         => __( 'Project brief', 'formspress' ),
					'level'        => 3,
					'size'         => '18px',
					'weight'       => '700',
					'color'        => '#c7d2fe',
					'marginBottom' => '18px',
				] ),
				TB::heading( [
					'text'         => __( 'Get a free quote', 'formspress' ),
					'level'        => 2,
					'size'         => '40px',
					'weight'       => '800',
					'color'        => '#ffffff',
					'marginBottom' => '12px',
				] ),
				TB::description( [
					'text'         => __( 'Tell us about your project. We reply within 24 hours with a tailored proposal.', 'formspress' ),
					'color'        => '#e0e7ff',
					'size'         => '16px',
					'marginBottom' => '30px',
				] ),
				TB::group( [
					'inner' => implode( "\n", [
						TB::heading( [
							'text' => __( 'What we need', 'formspress' ),
							'level' => 3, 'size' => '22px', 'weight' => '800', 'color' => '#312e81',
							'marginBottom' => '8px',
						] ),
						TB::description( [
							'text' => __( 'Service, budget range and a short brief are enough to start a useful conversation.', 'formspress' ),
							'color' => '#4338ca', 'size' => '14px', 'marginBottom' => '0',
						] ),
					] ),
					'bg' => '#ffffff',
					'radius' => '18px',
					'padding' => '26px',
				] ),
			] ),
			'gradient' => 'linear-gradient(145deg,#312e81 0%,#4f46e5 55%,#06b6d4 100%)',
			'fg' => '#ffffff',
			'radius' => '24px',
			'padding' => '44px',
		] );

		$form = TB::group( [
			'inner' => implode( "\n", [
				$identity_row,
				TB::field_text( [ 'fieldId' => 'company', 'label' => __( 'Company', 'formspress' ), 'placeholder' => __( 'Acme Inc.', 'formspress' ) ] ),
				$service_row,
				TB::field_textarea( [ 'fieldId' => 'brief', 'label' => __( 'Tell us about the project', 'formspress' ), 'rows' => 5, 'required' => true ] ),
				TB::submit_button( [ 'text' => __( 'Request quote', 'formspress' ), 'bg' => '#4f46e5', 'fg' => '#ffffff', 'full' => true ] ),
			] ),
			'bg' => '#ffffff',
			'border' => '#c7d2fe',
			'radius' => '22px',
			'padding' => '38px',
		] );

		return TB::group( [
			'inner'    => TB::columns( $intro, $form, '24px' ),
			'gradient' => 'linear-gradient(135deg,#eef2ff 0%,#ecfeff 55%,#ffffff 100%)',
			'border'   => '#c7d2fe',
			'radius'   => '28px',
			'padding'  => '28px',
			'maxWidth' => '1040px',
		] );
	}
}
