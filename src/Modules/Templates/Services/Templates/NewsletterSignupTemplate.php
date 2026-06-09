<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

/**
 * Newsletter signup — bold dark hero card. Centered headline,
 * supporting line, single email field, inverted-white CTA button.
 * The "land it above the fold" template.
 */
class NewsletterSignupTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'newsletter-signup'; }
	public function get_label(): string       { return __( 'Newsletter signup', 'formspress' ); }
	public function get_description(): string { return __( 'Bold dark hero card with centered headline and single email field.', 'formspress' ); }
	public function get_category(): string    { return 'lead-gen'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'email'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'email',      'type' => 'email', 'label' => __( 'Email address', 'formspress' ), 'required' => true ],
			[ 'id' => 'first_name', 'type' => 'text',  'label' => __( 'First name', 'formspress' ) ],
		];
	}

	public function get_settings(): array {
		return [
			'submit_label'    => __( 'Subscribe', 'formspress' ),
			'success_message' => __( 'Thanks for subscribing!', 'formspress' ),
		];
	}

	public function get_block_markup(): ?string {
		$inner = implode( "\n", [
			TB::heading( [
				'text'         => __( 'Join our newsletter', 'formspress' ),
				'level'        => 2,
				'size'         => '34px',
				'weight'       => '800',
				'color'        => '#ffffff',
				'align'        => 'center',
				'marginBottom' => '8px',
			] ),
			TB::description( [
				'text'         => __( 'One email a week. Curated picks, no spam, unsubscribe anytime.', 'formspress' ),
				'color'        => '#cbd5e1',
				'size'         => '16px',
				'align'        => 'center',
				'marginBottom' => '28px',
			] ),
			TB::field_email( [
				'fieldId'     => 'email',
				'label'       => __( 'Email address', 'formspress' ),
				'required'    => true,
				'placeholder' => 'you@example.com',
			] ),
			TB::field_text( [
				'fieldId'     => 'first_name',
				'label'       => __( 'First name', 'formspress' ),
				'placeholder' => __( 'Jane', 'formspress' ),
			] ),
			TB::submit_button( [
				'text' => __( 'Subscribe', 'formspress' ),
				'bg'   => '#ffffff',
				'fg'   => '#0f172a',
				'full' => true,
			] ),
		] );

		return TB::group( [
			'inner'     => $inner,
			'bg'        => '#111827',
			'fg'        => '#ffffff',
			'border'    => '#334155',
			'radius'    => '20px',
			'padding'   => '64px',
			'maxWidth'  => '520px',
			'textAlign' => 'center',
		] );
	}
}
