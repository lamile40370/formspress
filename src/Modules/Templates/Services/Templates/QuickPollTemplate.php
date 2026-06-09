<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;

class QuickPollTemplate extends AbstractTemplate {

	public function get_id(): string {
		return 'quick-poll';
	}

	public function get_label(): string {
		return __( 'Quick poll', 'formspress' );
	}

	public function get_description(): string {
		return __( 'A single-question poll to gather a quick opinion.', 'formspress' );
	}

	public function get_category(): string {
		return 'feedback';
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
				'id'       => 'choice',
				'type'     => 'radio',
				'label'    => __( 'Which option do you prefer?', 'formspress' ),
				'required' => true,
				'options'  => [
					__( 'Option A', 'formspress' ),
					__( 'Option B', 'formspress' ),
					__( 'Option C', 'formspress' ),
					__( 'None of the above', 'formspress' ),
				],
			],
		];
	}

	public function get_settings(): array {
		return [
			'welcome_title'       => __( 'Quick poll', 'formspress' ),
			'welcome_description' => __( 'One question — takes 5 seconds.', 'formspress' ),
			'start_label'         => __( 'Start', 'formspress' ),
			'end_title'           => __( 'Thanks!', 'formspress' ),
			'success_message'     => __( 'Your vote has been recorded.', 'formspress' ),
			'submit_label'        => __( 'Submit', 'formspress' ),
			'next_label'          => __( 'OK', 'formspress' ),
		];
	}
}
