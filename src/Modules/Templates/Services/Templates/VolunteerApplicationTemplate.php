<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

class VolunteerApplicationTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'volunteer-application'; }
	public function get_label(): string       { return __( 'Volunteer application', 'formspress' ); }
	public function get_description(): string { return __( 'Non-profit volunteer intake with availability, interests and motivation.', 'formspress' ); }
	public function get_category(): string    { return 'nonprofit'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'groups'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'name', 'type' => 'text', 'label' => __( 'Full name', 'formspress' ), 'required' => true ],
			[ 'id' => 'email', 'type' => 'email', 'label' => __( 'Email', 'formspress' ), 'required' => true ],
			[ 'id' => 'phone', 'type' => 'text', 'label' => __( 'Phone', 'formspress' ) ],
			[ 'id' => 'availability', 'type' => 'checkbox', 'label' => __( 'Availability', 'formspress' ), 'options' => [ __( 'Weekdays', 'formspress' ), __( 'Weekends', 'formspress' ), __( 'Evenings', 'formspress' ), __( 'Remote', 'formspress' ) ] ],
			[ 'id' => 'interests', 'type' => 'checkbox', 'label' => __( 'Areas of interest', 'formspress' ), 'options' => [ __( 'Events', 'formspress' ), __( 'Fundraising', 'formspress' ), __( 'Mentoring', 'formspress' ), __( 'Admin', 'formspress' ) ] ],
			[ 'id' => 'motivation', 'type' => 'textarea', 'label' => __( 'Why do you want to volunteer?', 'formspress' ), 'required' => true ],
		];
	}

	public function get_block_markup(): ?string {
		$availability = [
			[ 'label' => __( 'Weekdays', 'formspress' ), 'value' => 'weekdays' ],
			[ 'label' => __( 'Weekends', 'formspress' ), 'value' => 'weekends' ],
			[ 'label' => __( 'Evenings', 'formspress' ), 'value' => 'evenings' ],
			[ 'label' => __( 'Remote', 'formspress' ),   'value' => 'remote' ],
		];
		$interests = [
			[ 'label' => __( 'Events', 'formspress' ),      'value' => 'events' ],
			[ 'label' => __( 'Fundraising', 'formspress' ), 'value' => 'fundraising' ],
			[ 'label' => __( 'Mentoring', 'formspress' ),   'value' => 'mentoring' ],
			[ 'label' => __( 'Admin', 'formspress' ),       'value' => 'admin' ],
		];

		$impact = TB::group( [
			'inner' => implode( "\n", [
				TB::heading( [
					'text' => __( '120+ hours', 'formspress' ),
					'level' => 3, 'size' => '34px', 'weight' => '800', 'color' => '#7f1d1d',
					'marginBottom' => '6px',
				] ),
				TB::description( [
					'text' => __( 'Local support coordinated every month through events, mentoring and remote admin help.', 'formspress' ),
					'color' => '#991b1b', 'size' => '14px', 'marginBottom' => '0',
				] ),
			] ),
			'bg' => '#fff7f7',
			'radius' => '28px',
			'padding' => '30px',
		] );

		$focus_row = TB::columns(
			TB::group( [
				'inner' => TB::description( [
					'text' => __( 'Events and logistics', 'formspress' ),
					'color' => '#ffffff', 'size' => '14px', 'marginBottom' => '0',
				] ),
				'bg' => '#be123c',
				'radius' => '999px',
				'padding' => '14px',
			] ),
			TB::group( [
				'inner' => TB::description( [
					'text' => __( 'Mentoring and support', 'formspress' ),
					'color' => '#ffffff', 'size' => '14px', 'marginBottom' => '0',
				] ),
				'bg' => '#9f1239',
				'radius' => '999px',
				'padding' => '14px',
			] ),
			'12px'
		);

		$left = TB::group( [
			'inner' => implode( "\n", [
				TB::heading( [
					'text' => __( 'Community crew', 'formspress' ),
					'level' => 3, 'size' => '17px', 'weight' => '700', 'color' => '#fecaca',
					'marginBottom' => '16px',
				] ),
				TB::heading( [
					'text' => __( 'Volunteer with us', 'formspress' ),
					'level' => 2, 'size' => '46px', 'weight' => '800', 'color' => '#ffffff',
					'marginBottom' => '12px',
				] ),
				TB::description( [
					'text' => __( 'Tell us when you are available and where you would like to contribute.', 'formspress' ),
					'color' => '#ffe4e6', 'size' => '17px', 'marginBottom' => '30px',
				] ),
				$impact,
				$focus_row,
			] ),
			'gradient' => 'linear-gradient(145deg,#450a0a 0%,#991b1b 48%,#f43f5e 100%)',
			'fg' => '#ffffff',
			'radius' => '34px',
			'padding' => '54px',
		] );

		$right = implode( "\n", [
			TB::heading( [
				'text' => __( 'Apply to join', 'formspress' ),
				'level' => 3, 'size' => '26px', 'weight' => '800', 'color' => '#111827',
				'marginBottom' => '8px',
			] ),
			TB::description( [
				'text' => __( 'A few details help us match you with the right team.', 'formspress' ),
				'color' => '#52525b', 'size' => '14px', 'marginBottom' => '22px',
			] ),
			TB::field_text( [ 'fieldId' => 'name', 'label' => __( 'Full name', 'formspress' ), 'required' => true ] ),
			TB::field_email( [ 'fieldId' => 'email', 'label' => __( 'Email', 'formspress' ), 'required' => true ] ),
			TB::field_text( [ 'fieldId' => 'phone', 'label' => __( 'Phone', 'formspress' ), 'placeholder' => __( 'Optional', 'formspress' ) ] ),
			TB::field_checkbox( [ 'fieldId' => 'availability', 'label' => __( 'Availability', 'formspress' ), 'options' => $availability ] ),
			TB::field_checkbox( [ 'fieldId' => 'interests', 'label' => __( 'Areas of interest', 'formspress' ), 'options' => $interests ] ),
			TB::field_textarea( [ 'fieldId' => 'motivation', 'label' => __( 'Why do you want to volunteer?', 'formspress' ), 'required' => true, 'rows' => 4 ] ),
			TB::submit_button( [ 'text' => __( 'Apply to volunteer', 'formspress' ), 'bg' => '#991b1b', 'fg' => '#ffffff', 'full' => true, 'radius' => '999px' ] ),
		] );

		return TB::group( [
			'inner' => implode( "\n", [
				TB::columns(
					$left,
					TB::group( [
						'inner' => $right,
						'bg' => 'rgba(255,255,255,0.94)',
						'radius' => '30px',
						'padding' => '46px',
					] ),
					'34px'
				),
			] ),
			'gradient' => 'linear-gradient(135deg,#fff1f2 0%,#ffe4e6 42%,#fff7ed 100%)',
			'radius' => '36px',
			'padding' => '34px',
			'maxWidth' => '1080px',
		] );
	}
}
