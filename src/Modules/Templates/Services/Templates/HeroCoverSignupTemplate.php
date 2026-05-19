<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

/**
 * Hero Cover signup — full-bleed `core/cover` block with a background
 * image + dark overlay, hero headline, and a centered "Start your free
 * trial" two-field form. The premier example of Gutenberg power: a
 * cover block IS the form's root container.
 */
class HeroCoverSignupTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'hero-cover-signup'; }
	public function get_label(): string       { return __( 'Hero cover signup', 'flowforms' ); }
	public function get_description(): string { return __( 'Full-bleed cover with background image + dark overlay. Hero headline, two-field signup.', 'flowforms' ); }
	public function get_category(): string    { return 'lead-gen'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'cover-image'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'name',  'type' => 'text',  'label' => __( 'Full name', 'flowforms' ),  'required' => true ],
			[ 'id' => 'email', 'type' => 'email', 'label' => __( 'Work email', 'flowforms' ), 'required' => true ],
		];
	}

	public function get_settings(): array {
		return [
			'submit_label'    => __( 'Start free trial', 'flowforms' ),
			'success_message' => __( 'Welcome aboard — check your inbox to confirm.', 'flowforms' ),
		];
	}

	public function get_block_markup(): ?string {
		$image_url = TB::placeholder( '1600x900', '0f172a', 'ffffff' );

		$inner = implode( "\n", [
			TB::heading( [
				'text'         => __( 'Start your free trial', 'flowforms' ),
				'level'        => 2,
				'size'         => '44px',
				'weight'       => '800',
				'color'        => '#ffffff',
				'align'        => 'center',
				'marginBottom' => '8px',
			] ),
			TB::description( [
				'text'         => __( 'No credit card required. 14 days, full access, cancel anytime.', 'flowforms' ),
				'color'        => '#e2e8f0',
				'size'         => '17px',
				'align'        => 'center',
				'marginBottom' => '32px',
			] ),
			TB::field_text(  [ 'fieldId' => 'name',  'label' => __( 'Full name', 'flowforms' ),  'required' => true, 'placeholder' => __( 'Jane Doe', 'flowforms' ) ] ),
			TB::field_email( [ 'fieldId' => 'email', 'label' => __( 'Work email', 'flowforms' ), 'required' => true, 'placeholder' => 'jane@company.com' ] ),
			TB::submit_button( [
				'text' => __( 'Get started — it\'s free', 'flowforms' ),
				'bg'   => '#ffffff',
				'fg'   => '#0f172a',
				'full' => true,
			] ),
		] );

		return TB::cover( [
			'inner'          => $inner,
			'image'          => $image_url,
			'overlayOpacity' => 80,
			'overlayColor'   => '#0f172a',
			'minHeight'      => 480,
			'maxWidth'       => '560px',
			'paddingY'       => '64px',
		] );
	}
}
