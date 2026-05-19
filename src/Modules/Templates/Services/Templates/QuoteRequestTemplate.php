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
	public function get_label(): string       { return __( 'Quote request', 'flowforms' ); }
	public function get_description(): string { return __( 'B2B lead capture — service type, budget, project brief. Indigo accent.', 'flowforms' ); }
	public function get_category(): string    { return 'lead-gen'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'analytics'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'full_name', 'type' => 'text',     'label' => __( 'Full name', 'flowforms' ),  'required' => true ],
			[ 'id' => 'email',     'type' => 'email',    'label' => __( 'Work email', 'flowforms' ), 'required' => true ],
			[ 'id' => 'company',   'type' => 'text',     'label' => __( 'Company', 'flowforms' ) ],
			[ 'id' => 'service',   'type' => 'select',   'label' => __( 'Service needed', 'flowforms' ), 'required' => true, 'options' => [ __( 'Design', 'flowforms' ), __( 'Development', 'flowforms' ), __( 'Consulting', 'flowforms' ), __( 'Other', 'flowforms' ) ] ],
			[ 'id' => 'budget',    'type' => 'select',   'label' => __( 'Estimated budget', 'flowforms' ), 'options' => [ '< $5k', '$5k – $20k', '$20k – $100k', '> $100k' ] ],
			[ 'id' => 'brief',     'type' => 'textarea', 'label' => __( 'Tell us about the project', 'flowforms' ), 'required' => true ],
		];
	}

	public function get_actions(): array {
		return [
			[
				'type'     => 'email',
				'enabled'  => true,
				'to'       => get_option( 'admin_email', '' ),
				'subject'  => sprintf( __( 'New quote request from %s', 'flowforms' ), '{field:full_name}' ),
				'body'     => '',
				'reply_to' => '{field:email}',
			],
		];
	}

	public function get_block_markup(): ?string {
		$services = [
			[ 'label' => __( 'Design', 'flowforms' ),      'value' => 'design' ],
			[ 'label' => __( 'Development', 'flowforms' ), 'value' => 'development' ],
			[ 'label' => __( 'Consulting', 'flowforms' ),  'value' => 'consulting' ],
			[ 'label' => __( 'Other', 'flowforms' ),       'value' => 'other' ],
		];
		$budgets = [
			[ 'label' => '< $5k',         'value' => 'lt5k' ],
			[ 'label' => '$5k – $20k',    'value' => '5to20' ],
			[ 'label' => '$20k – $100k',  'value' => '20to100' ],
			[ 'label' => '> $100k',       'value' => 'gt100' ],
		];

		// Side-by-side name + email.
		$identity_row = TB::columns(
			TB::field_text(  [ 'fieldId' => 'full_name', 'label' => __( 'Full name', 'flowforms' ),  'required' => true, 'placeholder' => __( 'Jane Doe', 'flowforms' ) ] ),
			TB::field_email( [ 'fieldId' => 'email',     'label' => __( 'Work email', 'flowforms' ), 'required' => true, 'placeholder' => 'jane@company.com' ] ),
			'16px'
		);
		$service_row = TB::columns(
			TB::field_select( [ 'fieldId' => 'service', 'label' => __( 'Service needed', 'flowforms' ),   'required' => true, 'options' => $services ] ),
			TB::field_select( [ 'fieldId' => 'budget',  'label' => __( 'Estimated budget', 'flowforms' ), 'options' => $budgets ] ),
			'16px'
		);

		$inner = implode( "\n", [
			TB::heading( [
				'text'         => __( 'Get a free quote', 'flowforms' ),
				'level'        => 2,
				'size'         => '28px',
				'weight'       => '700',
				'color'        => '#111827',
				'marginBottom' => '4px',
			] ),
			TB::description( [
				'text'         => __( 'Tell us about your project. We reply within 24 hours with a tailored proposal.', 'flowforms' ),
				'color'        => '#6b7280',
				'size'         => '14px',
				'marginBottom' => '24px',
			] ),
			$identity_row,
			TB::field_text( [ 'fieldId' => 'company', 'label' => __( 'Company', 'flowforms' ), 'placeholder' => __( 'Acme Inc.', 'flowforms' ) ] ),
			$service_row,
			TB::field_textarea( [ 'fieldId' => 'brief', 'label' => __( 'Tell us about the project', 'flowforms' ), 'rows' => 5, 'required' => true ] ),
			TB::submit_button( [ 'text' => __( 'Request quote', 'flowforms' ), 'bg' => '#4f46e5', 'fg' => '#ffffff' ] ),
		] );

		return TB::group( [
			'inner'    => $inner,
			'bg'       => '#f8fafc',
			'border'   => '#c7d2fe',
			'radius'   => '18px',
			'padding'  => '56px',
			'maxWidth' => '760px',
		] );
	}
}
