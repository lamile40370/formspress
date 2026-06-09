<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

class ProductFeedbackTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'product-feedback'; }
	public function get_label(): string       { return __( 'Product feedback', 'formspress' ); }
	public function get_description(): string { return __( 'Customer research form with rating, feature feedback and product context.', 'formspress' ); }
	public function get_category(): string    { return 'feedback'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'star-filled'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'role', 'type' => 'select', 'label' => __( 'Your role', 'formspress' ), 'options' => [ __( 'Founder', 'formspress' ), __( 'Marketer', 'formspress' ), __( 'Operations', 'formspress' ), __( 'Developer', 'formspress' ) ] ],
			[ 'id' => 'rating', 'type' => 'radio', 'label' => __( 'Overall rating', 'formspress' ), 'required' => true, 'options' => [ '5', '4', '3', '2', '1' ] ],
			[ 'id' => 'features', 'type' => 'checkbox', 'label' => __( 'Most useful features', 'formspress' ), 'options' => [ __( 'Automations', 'formspress' ), __( 'Analytics', 'formspress' ), __( 'Collaboration', 'formspress' ), __( 'Integrations', 'formspress' ) ] ],
			[ 'id' => 'improve', 'type' => 'textarea', 'label' => __( 'What should we improve?', 'formspress' ), 'required' => true ],
			[ 'id' => 'email', 'type' => 'email', 'label' => __( 'Email for follow-up', 'formspress' ) ],
		];
	}

	public function get_block_markup(): ?string {
		$roles = [
			[ 'label' => __( 'Founder', 'formspress' ),    'value' => 'founder' ],
			[ 'label' => __( 'Marketer', 'formspress' ),   'value' => 'marketer' ],
			[ 'label' => __( 'Operations', 'formspress' ), 'value' => 'operations' ],
			[ 'label' => __( 'Developer', 'formspress' ),  'value' => 'developer' ],
		];
		$ratings = [
			[ 'label' => __( 'Excellent', 'formspress' ), 'value' => '5' ],
			[ 'label' => __( 'Good', 'formspress' ),      'value' => '4' ],
			[ 'label' => __( 'Average', 'formspress' ),   'value' => '3' ],
			[ 'label' => __( 'Poor', 'formspress' ),      'value' => '2' ],
		];
		$features = [
			[ 'label' => __( 'Automations', 'formspress' ),   'value' => 'automations' ],
			[ 'label' => __( 'Analytics', 'formspress' ),     'value' => 'analytics' ],
			[ 'label' => __( 'Collaboration', 'formspress' ), 'value' => 'collaboration' ],
			[ 'label' => __( 'Integrations', 'formspress' ),  'value' => 'integrations' ],
		];

		$left = TB::group( [
			'inner' => implode( "\n", [
				TB::heading( [
					'text' => __( 'Roadmap signal', 'formspress' ),
					'level' => 3, 'size' => '18px', 'weight' => '700', 'color' => '#bbf7d0',
					'marginBottom' => '18px',
				] ),
				TB::heading( [
					'text' => __( 'Help shape the roadmap', 'formspress' ),
					'level' => 2, 'size' => '42px', 'weight' => '800', 'color' => '#ffffff',
					'marginBottom' => '12px',
				] ),
				TB::description( [
					'text' => __( 'A short research form for customers after onboarding, beta programs or feature launches.', 'formspress' ),
					'color' => '#dcfce7', 'size' => '16px', 'marginBottom' => '30px',
				] ),
				TB::group( [
					'inner' => implode( "\n", [
						TB::heading( [
							'text' => __( '4 quick questions', 'formspress' ),
							'level' => 3, 'size' => '22px', 'weight' => '800', 'color' => '#064e3b',
							'marginBottom' => '6px',
						] ),
						TB::description( [
							'text' => __( 'Collect the rating, the strongest features and the next improvement in one focused pass.', 'formspress' ),
							'color' => '#166534', 'size' => '14px', 'marginBottom' => '0',
						] ),
					] ),
					'bg' => '#ffffff',
					'radius' => '18px',
					'padding' => '26px',
				] ),
			] ),
			'gradient' => 'linear-gradient(135deg,#052e16 0%,#166534 52%,#22c55e 100%)',
			'fg' => '#ffffff',
			'radius' => '24px',
			'padding' => '44px',
		] );

		$right = TB::group( [
			'inner' => implode( "\n", [
				TB::heading( [
					'text' => __( 'Tell us what matters', 'formspress' ),
					'level' => 3, 'size' => '24px', 'weight' => '800', 'color' => '#052e16',
					'marginBottom' => '6px',
				] ),
				TB::description( [
					'text' => __( 'Your answers help us prioritise the next release.', 'formspress' ),
					'color' => '#4b5563', 'size' => '14px', 'marginBottom' => '20px',
				] ),
				TB::field_select( [ 'fieldId' => 'role', 'label' => __( 'Your role', 'formspress' ), 'options' => $roles ] ),
				TB::field_radio( [ 'fieldId' => 'rating', 'label' => __( 'Overall rating', 'formspress' ), 'required' => true, 'options' => $ratings ] ),
				TB::field_checkbox( [ 'fieldId' => 'features', 'label' => __( 'Most useful features', 'formspress' ), 'options' => $features ] ),
				TB::field_textarea( [ 'fieldId' => 'improve', 'label' => __( 'What should we improve?', 'formspress' ), 'required' => true, 'rows' => 4 ] ),
				TB::field_email( [ 'fieldId' => 'email', 'label' => __( 'Email for follow-up', 'formspress' ), 'placeholder' => 'you@example.com' ] ),
				TB::submit_button( [ 'text' => __( 'Send feedback', 'formspress' ), 'bg' => '#14532d', 'fg' => '#ffffff', 'full' => true ] ),
			] ),
			'bg' => '#ffffff',
			'border' => '#bbf7d0',
			'radius' => '22px',
			'padding' => '38px',
		] );

		return TB::group( [
			'inner' => TB::columns( $left, $right, '24px' ),
			'gradient' => 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 45%,#ecfeff 100%)',
			'border' => '#bbf7d0',
			'radius' => '28px',
			'padding' => '28px',
			'maxWidth' => '1040px',
		] );
	}
}
