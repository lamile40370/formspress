<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;

class CustomerSurveyTemplate extends AbstractTemplate {

	public function get_id(): string {
		return 'customer-survey';
	}

	public function get_label(): string {
		return __( 'Customer survey', 'flowforms' );
	}

	public function get_description(): string {
		return __( 'Collect customer satisfaction, NPS and qualitative feedback.', 'flowforms' );
	}

	public function get_category(): string {
		return 'survey';
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
				'id'       => 'rating',
				'type'     => 'rating',
				'label'    => __( 'How would you rate your experience?', 'flowforms' ),
				'required' => true,
				'max'      => 5,
			],
			[
				'id'           => 'nps',
				'type'         => 'nps',
				'label'        => __( 'How likely are you to recommend us to a friend?', 'flowforms' ),
				'required'     => true,
				'nps_min_label'=> __( 'Not at all likely', 'flowforms' ),
				'nps_max_label'=> __( 'Extremely likely', 'flowforms' ),
			],
			[
				'id'       => 'liked',
				'type'     => 'textarea',
				'label'    => __( 'What did you like the most?', 'flowforms' ),
				'required' => false,
			],
			[
				'id'       => 'improve',
				'type'     => 'textarea',
				'label'    => __( 'What can we improve?', 'flowforms' ),
				'required' => false,
			],
		];
	}

	public function get_settings(): array {
		return [
			'welcome_title'       => __( "We'd love your feedback", 'flowforms' ),
			'welcome_description' => __( 'Just a few quick questions — under a minute.', 'flowforms' ),
			'start_label'         => __( 'Start', 'flowforms' ),
			'end_title'           => __( 'Thank you!', 'flowforms' ),
			'success_message'     => __( 'Your feedback helps us improve.', 'flowforms' ),
			'submit_label'        => __( 'Submit', 'flowforms' ),
			'next_label'          => __( 'OK', 'flowforms' ),
		];
	}
}
