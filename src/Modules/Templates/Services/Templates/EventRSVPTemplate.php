<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;

class EventRSVPTemplate extends AbstractTemplate {

	public function get_id(): string {
		return 'event-rsvp';
	}

	public function get_label(): string {
		return __( 'Event RSVP', 'flowforms' );
	}

	public function get_description(): string {
		return __( 'Collect RSVPs, guest counts and dietary requirements for your event.', 'flowforms' );
	}

	public function get_category(): string {
		return 'event';
	}

	public function get_type(): string {
		return 'flow';
	}

	public function get_icon(): string {
		return 'brush';
	}

	public function get_fields(): array {
		return [
			[
				'id'       => 'full_name',
				'type'     => 'text',
				'label'    => __( 'What is your full name?', 'flowforms' ),
				'required' => true,
			],
			[
				'id'       => 'email',
				'type'     => 'email',
				'label'    => __( 'What is your email?', 'flowforms' ),
				'required' => true,
			],
			[
				'id'        => 'attending',
				'type'      => 'yes_no',
				'label'     => __( 'Will you be attending?', 'flowforms' ),
				'required'  => true,
				'yes_label' => __( 'Yes', 'flowforms' ),
				'no_label'  => __( 'No', 'flowforms' ),
			],
			[
				'id'       => 'guests',
				'type'     => 'number',
				'label'    => __( 'How many guests will you bring?', 'flowforms' ),
				'required' => false,
			],
			[
				'id'       => 'dietary',
				'type'     => 'textarea',
				'label'    => __( 'Any dietary requirements?', 'flowforms' ),
				'required' => false,
			],
		];
	}

	public function get_settings(): array {
		return [
			'welcome_title'       => __( "You're invited!", 'flowforms' ),
			'welcome_description' => __( 'Let us know if you can make it.', 'flowforms' ),
			'start_label'         => __( 'RSVP now', 'flowforms' ),
			'end_title'           => __( 'See you there!', 'flowforms' ),
			'success_message'     => __( 'Your RSVP has been recorded.', 'flowforms' ),
			'submit_label'        => __( 'Submit RSVP', 'flowforms' ),
			'next_label'          => __( 'OK', 'flowforms' ),
		];
	}
}
