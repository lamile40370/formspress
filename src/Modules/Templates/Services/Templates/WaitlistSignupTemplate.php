<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

class WaitlistSignupTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'waitlist-signup'; }
	public function get_label(): string       { return __( 'Waitlist signup', 'formspress' ); }
	public function get_description(): string { return __( 'Launch waitlist with audience segment, use case and referral source.', 'formspress' ); }
	public function get_category(): string    { return 'lead-gen'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'megaphone'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'email', 'type' => 'email', 'label' => __( 'Email', 'formspress' ), 'required' => true ],
			[ 'id' => 'name', 'type' => 'text', 'label' => __( 'Name', 'formspress' ) ],
			[ 'id' => 'segment', 'type' => 'select', 'label' => __( 'I am a...', 'formspress' ), 'options' => [ __( 'Creator', 'formspress' ), __( 'Founder', 'formspress' ), __( 'Team lead', 'formspress' ), __( 'Student', 'formspress' ) ] ],
			[ 'id' => 'use_case', 'type' => 'textarea', 'label' => __( 'What would you use it for?', 'formspress' ) ],
		];
	}

	public function get_block_markup(): ?string {
		$segments = [
			[ 'label' => __( 'Creator', 'formspress' ),   'value' => 'creator' ],
			[ 'label' => __( 'Founder', 'formspress' ),   'value' => 'founder' ],
			[ 'label' => __( 'Team lead', 'formspress' ), 'value' => 'team-lead' ],
			[ 'label' => __( 'Student', 'formspress' ),   'value' => 'student' ],
		];

		$quick_row = TB::columns(
			TB::field_email( [ 'fieldId' => 'email', 'label' => __( 'Email', 'formspress' ), 'required' => true, 'placeholder' => 'you@example.com' ] ),
			TB::field_text( [ 'fieldId' => 'name', 'label' => __( 'Name', 'formspress' ), 'placeholder' => __( 'Optional', 'formspress' ) ] ),
			'16px'
		);

		$left = implode( "\n", [
			TB::heading( [
				'text' => __( 'Get early access', 'formspress' ),
				'level' => 2, 'size' => '40px', 'weight' => '800', 'color' => '#111827',
				'marginBottom' => '10px',
			] ),
			TB::description( [
				'text' => __( 'Join the private waitlist. We invite small batches as soon as new seats open.', 'formspress' ),
				'color' => '#374151', 'size' => '16px', 'marginBottom' => '0',
			] ),
		] );
		$right = implode( "\n", [
			$quick_row,
			TB::field_select( [ 'fieldId' => 'segment', 'label' => __( 'I am a...', 'formspress' ), 'options' => $segments ] ),
			TB::field_textarea( [ 'fieldId' => 'use_case', 'label' => __( 'What would you use it for?', 'formspress' ), 'rows' => 3 ] ),
			TB::submit_button( [ 'text' => __( 'Join waitlist', 'formspress' ), 'bg' => '#111827', 'fg' => '#ffffff', 'full' => true ] ),
		] );

		return TB::group( [
			'inner' => TB::columns( $left, $right, '42px' ),
			'bg' => '#fefce8',
			'border' => '#fde047',
			'radius' => '26px',
			'padding' => '54px',
			'maxWidth' => '920px',
		] );
	}
}
