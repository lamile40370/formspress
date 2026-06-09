<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

class ClientOnboardingTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'client-onboarding'; }
	public function get_label(): string       { return __( 'Client onboarding', 'formspress' ); }
	public function get_description(): string { return __( 'Agency onboarding intake — project goals, stakeholders, assets and access notes.', 'formspress' ); }
	public function get_category(): string    { return 'operations'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'clipboard'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'client_name', 'type' => 'text', 'label' => __( 'Client name', 'formspress' ), 'required' => true ],
			[ 'id' => 'email', 'type' => 'email', 'label' => __( 'Primary contact email', 'formspress' ), 'required' => true ],
			[ 'id' => 'project_type', 'type' => 'select', 'label' => __( 'Project type', 'formspress' ), 'options' => [ __( 'Website', 'formspress' ), __( 'Branding', 'formspress' ), __( 'Marketing', 'formspress' ), __( 'Custom build', 'formspress' ) ] ],
			[ 'id' => 'deadline', 'type' => 'text', 'label' => __( 'Target launch date', 'formspress' ) ],
			[ 'id' => 'assets', 'type' => 'checkbox', 'label' => __( 'Available assets', 'formspress' ), 'options' => [ __( 'Logo', 'formspress' ), __( 'Brand guide', 'formspress' ), __( 'Copy', 'formspress' ), __( 'Photography', 'formspress' ) ] ],
			[ 'id' => 'goals', 'type' => 'textarea', 'label' => __( 'Project goals', 'formspress' ), 'required' => true ],
		];
	}

	public function get_block_markup(): ?string {
		$project_types = [
			[ 'label' => __( 'Website', 'formspress' ),      'value' => 'website' ],
			[ 'label' => __( 'Branding', 'formspress' ),     'value' => 'branding' ],
			[ 'label' => __( 'Marketing', 'formspress' ),    'value' => 'marketing' ],
			[ 'label' => __( 'Custom build', 'formspress' ), 'value' => 'custom' ],
		];
		$assets = [
			[ 'label' => __( 'Logo', 'formspress' ),        'value' => 'logo' ],
			[ 'label' => __( 'Brand guide', 'formspress' ), 'value' => 'brand-guide' ],
			[ 'label' => __( 'Copy', 'formspress' ),        'value' => 'copy' ],
			[ 'label' => __( 'Photography', 'formspress' ), 'value' => 'photography' ],
		];

		$contact_row = TB::columns(
			TB::field_text( [ 'fieldId' => 'client_name', 'label' => __( 'Client name', 'formspress' ), 'required' => true ] ),
			TB::field_email( [ 'fieldId' => 'email', 'label' => __( 'Primary contact email', 'formspress' ), 'required' => true ] ),
			'16px'
		);
		$planning_row = TB::columns(
			TB::field_select( [ 'fieldId' => 'project_type', 'label' => __( 'Project type', 'formspress' ), 'options' => $project_types ] ),
			TB::field_text( [ 'fieldId' => 'deadline', 'label' => __( 'Target launch date', 'formspress' ), 'placeholder' => 'YYYY-MM-DD' ] ),
			'16px'
		);

		$left = implode( "\n", [
			TB::heading( [
				'text' => __( 'Start with the right inputs', 'formspress' ),
				'level' => 2, 'size' => '30px', 'weight' => '800', 'color' => '#3b0764',
				'marginBottom' => '8px',
			] ),
			TB::description( [
				'text' => __( 'Collect the details your team needs before kickoff: goals, timing, assets and decision makers.', 'formspress' ),
				'color' => '#6b21a8', 'size' => '15px', 'marginBottom' => '18px',
			] ),
			TB::image( TB::placeholder( '900x620', 'd8b4fe', '3b0764' ), __( 'Project kickoff board', 'formspress' ), [ 'radius' => '18px' ] ),
		] );

		$right = implode( "\n", [
			$contact_row,
			$planning_row,
			TB::field_checkbox( [ 'fieldId' => 'assets', 'label' => __( 'Available assets', 'formspress' ), 'options' => $assets ] ),
			TB::field_textarea( [ 'fieldId' => 'goals', 'label' => __( 'Project goals', 'formspress' ), 'rows' => 5, 'required' => true ] ),
			TB::submit_button( [ 'text' => __( 'Submit intake', 'formspress' ), 'bg' => '#7e22ce', 'fg' => '#ffffff', 'full' => true ] ),
		] );

		return TB::group( [
			'inner' => TB::columns( $left, $right, '36px' ),
			'bg' => '#faf5ff',
			'border' => '#e9d5ff',
			'radius' => '22px',
			'padding' => '52px',
			'maxWidth' => '980px',
		] );
	}
}
