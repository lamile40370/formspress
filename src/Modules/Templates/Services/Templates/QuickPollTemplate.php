<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;

class QuickPollTemplate extends AbstractTemplate {

	public function get_id(): string {
		return 'quick-poll';
	}

	public function get_label(): string {
		return __( 'Quick poll', 'flowforms' );
	}

	public function get_description(): string {
		return __( 'A single-question poll to gather a quick opinion.', 'flowforms' );
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
				'label'    => __( 'Which option do you prefer?', 'flowforms' ),
				'required' => true,
				'options'  => [
					__( 'Option A', 'flowforms' ),
					__( 'Option B', 'flowforms' ),
					__( 'Option C', 'flowforms' ),
					__( 'None of the above', 'flowforms' ),
				],
			],
		];
	}

	public function get_settings(): array {
		return [
			'welcome_title'       => __( 'Quick poll', 'flowforms' ),
			'welcome_description' => __( 'One question — takes 5 seconds.', 'flowforms' ),
			'start_label'         => __( 'Start', 'flowforms' ),
			'end_title'           => __( 'Thanks!', 'flowforms' ),
			'success_message'     => __( 'Your vote has been recorded.', 'flowforms' ),
			'submit_label'        => __( 'Submit', 'flowforms' ),
			'next_label'          => __( 'OK', 'flowforms' ),
		];
	}
}
