<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

/**
 * Support request — help-desk styling with a soft amber accent.
 * Header + hero image, then form on white card. Priority + topic
 * dropdowns segment incoming tickets for the team's triage queue.
 */
class SupportRequestTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'support-request'; }
	public function get_label(): string       { return __( 'Support request', 'flowforms' ); }
	public function get_description(): string { return __( 'Help-desk style ticket form with priority + topic dropdowns and amber accent.', 'flowforms' ); }
	public function get_category(): string    { return 'contact'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'sos'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'name',        'type' => 'text',     'label' => __( 'Name', 'flowforms' ),         'required' => true ],
			[ 'id' => 'email',       'type' => 'email',    'label' => __( 'Email', 'flowforms' ),        'required' => true ],
			[ 'id' => 'priority',    'type' => 'select',   'label' => __( 'Priority', 'flowforms' ),     'required' => true, 'options' => [ __( 'Low', 'flowforms' ), __( 'Medium', 'flowforms' ), __( 'High', 'flowforms' ), __( 'Urgent', 'flowforms' ) ] ],
			[ 'id' => 'topic',       'type' => 'select',   'label' => __( 'Topic', 'flowforms' ),        'required' => true, 'options' => [ __( 'Billing', 'flowforms' ), __( 'Technical issue', 'flowforms' ), __( 'Feature request', 'flowforms' ), __( 'Other', 'flowforms' ) ] ],
			[ 'id' => 'description', 'type' => 'textarea', 'label' => __( 'Description', 'flowforms' ),  'required' => true ],
		];
	}

	public function get_actions(): array {
		return [
			[
				'type'     => 'email',
				'enabled'  => true,
				'to'       => get_option( 'admin_email', '' ),
				'subject'  => sprintf( __( '[%s] New support request from {field:name}', 'flowforms' ), '{field:priority}' ),
				'body'     => '',
				'reply_to' => '{field:email}',
			],
		];
	}

	public function get_block_markup(): ?string {
		$select_priority = [
			[ 'label' => __( 'Low', 'flowforms' ),     'value' => 'low' ],
			[ 'label' => __( 'Medium', 'flowforms' ),  'value' => 'medium' ],
			[ 'label' => __( 'High', 'flowforms' ),    'value' => 'high' ],
			[ 'label' => __( 'Urgent', 'flowforms' ),  'value' => 'urgent' ],
		];
		$select_topic = [
			[ 'label' => __( 'Billing', 'flowforms' ),         'value' => 'billing' ],
			[ 'label' => __( 'Technical issue', 'flowforms' ), 'value' => 'technical' ],
			[ 'label' => __( 'Feature request', 'flowforms' ), 'value' => 'feature' ],
			[ 'label' => __( 'Other', 'flowforms' ),           'value' => 'other' ],
		];

		// Inline two-column row for the priority + topic dropdowns.
		$priority_topic_row = TB::columns(
			TB::field_select( [ 'fieldId' => 'priority', 'label' => __( 'Priority', 'flowforms' ), 'required' => true, 'options' => $select_priority ] ),
			TB::field_select( [ 'fieldId' => 'topic',    'label' => __( 'Topic', 'flowforms' ),    'required' => true, 'options' => $select_topic ] ),
			'16px'
		);

		$inner = implode( "\n", [
			TB::heading( [
				'text'         => __( 'How can we help?', 'flowforms' ),
				'level'        => 2,
				'size'         => '28px',
				'weight'       => '700',
				'color'        => '#7c2d12',
				'marginBottom' => '4px',
			] ),
			TB::description( [
				'text'         => __( 'Tell us what is going on. Our support team will get back to you within one business day — sooner for urgent issues.', 'flowforms' ),
				'color'        => '#92400e',
				'size'         => '14px',
				'marginBottom' => '24px',
			] ),
			TB::field_text(     [ 'fieldId' => 'name',        'label' => __( 'Name', 'flowforms' ),  'required' => true, 'placeholder' => __( 'Jane Doe', 'flowforms' ) ] ),
			TB::field_email(    [ 'fieldId' => 'email',       'label' => __( 'Email', 'flowforms' ), 'required' => true, 'placeholder' => 'you@example.com' ] ),
			$priority_topic_row,
			TB::field_textarea( [ 'fieldId' => 'description', 'label' => __( 'Describe the issue', 'flowforms' ), 'rows' => 6, 'required' => true, 'placeholder' => __( 'Steps to reproduce, expected vs. actual…', 'flowforms' ) ] ),
			TB::submit_button(  [ 'text' => __( 'Submit ticket', 'flowforms' ), 'bg' => '#d97706', 'fg' => '#ffffff' ] ),
		] );

		return TB::group( [
			'inner'       => $inner,
			'bg'          => '#ffffff',
			'border'      => '#fed7aa',
			'borderWidth' => '1px',
			'radius'      => '18px',
			'padding'     => '56px',
			'maxWidth'    => '680px',
		] );
	}
}
