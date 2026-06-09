<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;

class CustomerSurveyTemplate extends AbstractTemplate {

	public function get_id(): string {
		return 'customer-survey';
	}

	public function get_label(): string {
		return __( 'Customer survey', 'formspress' );
	}

	public function get_description(): string {
		return __( 'Collect customer satisfaction, NPS and qualitative feedback.', 'formspress' );
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
				'label'    => __( 'How would you rate your experience?', 'formspress' ),
				'required' => true,
				'max'      => 5,
			],
			[
				'id'           => 'nps',
				'type'         => 'nps',
				'label'        => __( 'How likely are you to recommend us to a friend?', 'formspress' ),
				'required'     => true,
				'nps_min_label'=> __( 'Not at all likely', 'formspress' ),
				'nps_max_label'=> __( 'Extremely likely', 'formspress' ),
			],
			[
				'id'       => 'liked',
				'type'     => 'textarea',
				'label'    => __( 'What did you like the most?', 'formspress' ),
				'required' => false,
			],
			[
				'id'       => 'improve',
				'type'     => 'textarea',
				'label'    => __( 'What can we improve?', 'formspress' ),
				'required' => false,
			],
		];
	}

	public function get_settings(): array {
		return [
			'welcome_title'       => __( "We'd love your feedback", 'formspress' ),
			'welcome_description' => __( 'Just a few quick questions — under a minute.', 'formspress' ),
			'start_label'         => __( 'Start', 'formspress' ),
			'end_title'           => __( 'Thank you!', 'formspress' ),
			'success_message'     => __( 'Your feedback helps us improve.', 'formspress' ),
			'submit_label'        => __( 'Submit', 'formspress' ),
			'next_label'          => __( 'OK', 'formspress' ),
		];
	}
}
