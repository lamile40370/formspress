<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;

class LeadCaptureFlowTemplate extends AbstractTemplate {

	public function get_id(): string {
		return 'lead-capture-flow';
	}

	public function get_label(): string {
		return __( 'Lead capture (Flow)', 'formspress' );
	}

	public function get_description(): string {
		return __( 'Conversational lead-capture flow with company and role details.', 'formspress' );
	}

	public function get_category(): string {
		return 'lead-gen';
	}

	public function get_type(): string {
		return 'flow';
	}

	public function get_icon(): string {
		return 'chartBar';
	}

	public function get_fields(): array {
		return [
			[
				'id'       => 'first_name',
				'type'     => 'text',
				'label'    => __( 'What is your first name?', 'formspress' ),
				'required' => true,
			],
			[
				'id'       => 'last_name',
				'type'     => 'text',
				'label'    => __( 'And your last name?', 'formspress' ),
				'required' => true,
			],
			[
				'id'       => 'company',
				'type'     => 'text',
				'label'    => __( 'Where do you work?', 'formspress' ),
				'required' => false,
			],
			[
				'id'       => 'role',
				'type'     => 'text',
				'label'    => __( 'What is your role?', 'formspress' ),
				'required' => false,
			],
			[
				'id'       => 'email',
				'type'     => 'email',
				'label'    => __( 'What is the best email to reach you?', 'formspress' ),
				'required' => true,
			],
			[
				'id'       => 'phone',
				'type'     => 'phone',
				'label'    => __( 'And a phone number?', 'formspress' ),
				'required' => false,
			],
		];
	}

	public function get_settings(): array {
		return [
			'welcome_title'       => __( "Let's get in touch", 'formspress' ),
			'welcome_description' => __( 'A few quick questions and we\'ll be in touch.', 'formspress' ),
			'start_label'         => __( 'Start', 'formspress' ),
			'end_title'           => __( 'Thanks!', 'formspress' ),
			'success_message'     => __( "We'll be in touch shortly.", 'formspress' ),
			'submit_label'        => __( 'Submit', 'formspress' ),
			'next_label'          => __( 'OK', 'formspress' ),
		];
	}
}
