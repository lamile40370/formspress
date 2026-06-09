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
	public function get_label(): string       { return __( 'Support request', 'formspress' ); }
	public function get_description(): string { return __( 'Help-desk style ticket form with priority + topic dropdowns and amber accent.', 'formspress' ); }
	public function get_category(): string    { return 'contact'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'sos'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'name',        'type' => 'text',     'label' => __( 'Name', 'formspress' ),         'required' => true ],
			[ 'id' => 'email',       'type' => 'email',    'label' => __( 'Email', 'formspress' ),        'required' => true ],
			[ 'id' => 'priority',    'type' => 'select',   'label' => __( 'Priority', 'formspress' ),     'required' => true, 'options' => [ __( 'Low', 'formspress' ), __( 'Medium', 'formspress' ), __( 'High', 'formspress' ), __( 'Urgent', 'formspress' ) ] ],
			[ 'id' => 'topic',       'type' => 'select',   'label' => __( 'Topic', 'formspress' ),        'required' => true, 'options' => [ __( 'Billing', 'formspress' ), __( 'Technical issue', 'formspress' ), __( 'Feature request', 'formspress' ), __( 'Other', 'formspress' ) ] ],
			[ 'id' => 'description', 'type' => 'textarea', 'label' => __( 'Description', 'formspress' ),  'required' => true ],
		];
	}

	public function get_actions(): array {
		return [
			[
				'type'     => 'email',
				'enabled'  => true,
				'to'       => get_option( 'admin_email', '' ),
				'subject'  => sprintf( __( '[%s] New support request from {field:name}', 'formspress' ), '{field:priority}' ),
				'body'     => '',
				'reply_to' => '{field:email}',
			],
		];
	}

	public function get_block_markup(): ?string {
		$select_priority = [
			[ 'label' => __( 'Low', 'formspress' ),     'value' => 'low' ],
			[ 'label' => __( 'Medium', 'formspress' ),  'value' => 'medium' ],
			[ 'label' => __( 'High', 'formspress' ),    'value' => 'high' ],
			[ 'label' => __( 'Urgent', 'formspress' ),  'value' => 'urgent' ],
		];
		$select_topic = [
			[ 'label' => __( 'Billing', 'formspress' ),         'value' => 'billing' ],
			[ 'label' => __( 'Technical issue', 'formspress' ), 'value' => 'technical' ],
			[ 'label' => __( 'Feature request', 'formspress' ), 'value' => 'feature' ],
			[ 'label' => __( 'Other', 'formspress' ),           'value' => 'other' ],
		];

		// Inline two-column row for the priority + topic dropdowns.
		$priority_topic_row = TB::columns(
			TB::field_select( [ 'fieldId' => 'priority', 'label' => __( 'Priority', 'formspress' ), 'required' => true, 'options' => $select_priority ] ),
			TB::field_select( [ 'fieldId' => 'topic',    'label' => __( 'Topic', 'formspress' ),    'required' => true, 'options' => $select_topic ] ),
			'16px'
		);

		$header = TB::group( [
			'inner' => implode( "\n", [
				TB::heading( [
					'text'         => __( 'Support desk', 'formspress' ),
					'level'        => 3,
					'size'         => '18px',
					'weight'       => '700',
					'color'        => '#fed7aa',
					'marginBottom' => '18px',
				] ),
				TB::heading( [
					'text'         => __( 'How can we help?', 'formspress' ),
					'level'        => 2,
					'size'         => '40px',
					'weight'       => '800',
					'color'        => '#ffffff',
					'marginBottom' => '12px',
				] ),
				TB::description( [
					'text'         => __( 'Tell us what is going on. Our support team will get back to you within one business day — sooner for urgent issues.', 'formspress' ),
					'color'        => '#ffedd5',
					'size'         => '16px',
					'marginBottom' => '0',
				] ),
			] ),
			'gradient' => 'linear-gradient(135deg,#431407 0%,#9a3412 55%,#f59e0b 100%)',
			'fg' => '#ffffff',
			'radius' => '24px',
			'padding' => '46px',
		] );

		$form = TB::group( [
			'inner' => implode( "\n", [
				TB::field_text(     [ 'fieldId' => 'name',        'label' => __( 'Name', 'formspress' ),  'required' => true, 'placeholder' => __( 'Jane Doe', 'formspress' ) ] ),
				TB::field_email(    [ 'fieldId' => 'email',       'label' => __( 'Email', 'formspress' ), 'required' => true, 'placeholder' => 'you@example.com' ] ),
				$priority_topic_row,
				TB::field_textarea( [ 'fieldId' => 'description', 'label' => __( 'Describe the issue', 'formspress' ), 'rows' => 6, 'required' => true, 'placeholder' => __( 'Steps to reproduce, expected vs. actual…', 'formspress' ) ] ),
				TB::submit_button(  [ 'text' => __( 'Submit ticket', 'formspress' ), 'bg' => '#9a3412', 'fg' => '#ffffff', 'full' => true ] ),
			] ),
			'bg' => '#ffffff',
			'border' => '#fed7aa',
			'radius' => '22px',
			'padding' => '38px',
		] );

		return TB::group( [
			'inner'       => TB::columns( $header, $form, '24px' ),
			'gradient'    => 'linear-gradient(135deg,#fff7ed 0%,#fffbeb 55%,#ffffff 100%)',
			'border'      => '#fed7aa',
			'borderWidth' => '1px',
			'radius'      => '28px',
			'padding'     => '28px',
			'maxWidth'    => '1040px',
		] );
	}
}
