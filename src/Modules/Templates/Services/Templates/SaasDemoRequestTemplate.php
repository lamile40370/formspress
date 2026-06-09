<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

class SaasDemoRequestTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'saas-demo-request'; }
	public function get_label(): string       { return __( 'SaaS demo request', 'formspress' ); }
	public function get_description(): string { return __( 'Two-column product demo form with company context, team size and timeline.', 'formspress' ); }
	public function get_category(): string    { return 'lead-gen'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'chart-line'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'work_email', 'type' => 'email', 'label' => __( 'Work email', 'formspress' ), 'required' => true ],
			[ 'id' => 'full_name',  'type' => 'text',  'label' => __( 'Full name', 'formspress' ), 'required' => true ],
			[ 'id' => 'company',    'type' => 'text',  'label' => __( 'Company', 'formspress' ), 'required' => true ],
			[ 'id' => 'team_size',  'type' => 'select', 'label' => __( 'Team size', 'formspress' ), 'options' => [ '1-10', '11-50', '51-200', '201+' ] ],
			[ 'id' => 'timeline',   'type' => 'radio', 'label' => __( 'Buying timeline', 'formspress' ), 'options' => [ __( 'This month', 'formspress' ), __( 'This quarter', 'formspress' ), __( 'Just researching', 'formspress' ) ] ],
			[ 'id' => 'goals',      'type' => 'textarea', 'label' => __( 'What should the demo cover?', 'formspress' ) ],
		];
	}

	public function get_actions(): array {
		return [
			[
				'type'     => 'email',
				'enabled'  => true,
				'to'       => get_option( 'admin_email', '' ),
				'subject'  => sprintf( __( 'Demo request from %s', 'formspress' ), '{field:company}' ),
				'body'     => '',
				'reply_to' => '{field:work_email}',
			],
		];
	}

	public function get_block_markup(): ?string {
		$team_sizes = [
			[ 'label' => '1-10',   'value' => '1-10' ],
			[ 'label' => '11-50',  'value' => '11-50' ],
			[ 'label' => '51-200', 'value' => '51-200' ],
			[ 'label' => '201+',   'value' => '201+' ],
		];
		$timelines = [
			[ 'label' => __( 'This month', 'formspress' ),      'value' => 'this-month' ],
			[ 'label' => __( 'This quarter', 'formspress' ),    'value' => 'this-quarter' ],
			[ 'label' => __( 'Just researching', 'formspress' ), 'value' => 'researching' ],
		];

		$identity_row = TB::columns(
			TB::field_text( [ 'fieldId' => 'full_name', 'label' => __( 'Full name', 'formspress' ), 'required' => true, 'placeholder' => __( 'Jane Martin', 'formspress' ) ] ),
			TB::field_email( [ 'fieldId' => 'work_email', 'label' => __( 'Work email', 'formspress' ), 'required' => true, 'placeholder' => 'jane@company.com' ] ),
			'16px'
		);
		$company_row = TB::columns(
			TB::field_text( [ 'fieldId' => 'company', 'label' => __( 'Company', 'formspress' ), 'required' => true, 'placeholder' => __( 'Acme Labs', 'formspress' ) ] ),
			TB::field_select( [ 'fieldId' => 'team_size', 'label' => __( 'Team size', 'formspress' ), 'options' => $team_sizes ] ),
			'16px'
		);

		$left = TB::group( [
			'inner' => implode( "\n", [
				TB::heading( [
					'text' => __( 'Live workspace tour', 'formspress' ),
					'level' => 3, 'size' => '18px', 'weight' => '700', 'color' => '#93c5fd',
					'marginBottom' => '18px',
				] ),
				TB::heading( [
					'text' => __( 'See the platform in context', 'formspress' ),
					'level' => 2, 'size' => '42px', 'weight' => '800', 'color' => '#f8fafc',
					'marginBottom' => '12px',
				] ),
				TB::description( [
					'text' => __( 'Book a focused walkthrough built around your workflow, data and team size.', 'formspress' ),
					'color' => '#dbeafe', 'size' => '16px', 'marginBottom' => '30px',
				] ),
				TB::group( [
					'inner' => implode( "\n", [
						TB::heading( [
							'text' => __( '30 min', 'formspress' ),
							'level' => 3, 'size' => '34px', 'weight' => '800', 'color' => '#0f172a',
							'marginBottom' => '4px',
						] ),
						TB::description( [
							'text' => __( 'Tailored demo, integration review and rollout next steps.', 'formspress' ),
							'color' => '#334155', 'size' => '14px', 'marginBottom' => '0',
						] ),
					] ),
					'bg' => '#ffffff',
					'radius' => '18px',
					'padding' => '26px',
				] ),
			] ),
			'gradient' => 'linear-gradient(145deg,#0f172a 0%,#1d4ed8 58%,#38bdf8 100%)',
			'fg' => '#f8fafc',
			'radius' => '24px',
			'padding' => '44px',
		] );

		$right = implode( "\n", [
			$identity_row,
			$company_row,
			TB::field_radio( [ 'fieldId' => 'timeline', 'label' => __( 'Buying timeline', 'formspress' ), 'options' => $timelines ] ),
			TB::field_textarea( [ 'fieldId' => 'goals', 'label' => __( 'What should the demo cover?', 'formspress' ), 'rows' => 4, 'placeholder' => __( 'Current process, must-have integrations, decision criteria...', 'formspress' ) ] ),
			TB::submit_button( [ 'text' => __( 'Book demo', 'formspress' ), 'bg' => '#0f172a', 'fg' => '#ffffff', 'full' => true ] ),
		] );

		return TB::group( [
			'inner' => TB::columns(
				$left,
				TB::group( [
					'inner' => $right,
					'bg' => '#ffffff',
					'border' => '#bae6fd',
					'radius' => '20px',
					'padding' => '42px',
				] ),
				'24px'
			),
			'gradient' => 'linear-gradient(135deg,#eff6ff 0%,#e0f2fe 48%,#f8fafc 100%)',
			'border' => '#bae6fd',
			'radius' => '24px',
			'padding' => '28px',
			'maxWidth' => '980px',
		] );
	}
}
