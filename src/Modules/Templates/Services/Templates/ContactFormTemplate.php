<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

/**
 * Contact form — classic name + email + subject + message.
 *
 * Gutenberg-iso design: a `core/cover` hero (slate-900 image overlay)
 * sits above a `core/group` card containing the form. Headline +
 * description in the cover, fields + dark filled submit in the card.
 * Demonstrates how a template can ship a real multi-block layout.
 */
class ContactFormTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'contact-form'; }
	public function get_label(): string       { return __( 'Contact form', 'formspress' ); }
	public function get_description(): string { return __( 'Hero banner + white-card contact form — classic name / email / subject / message.', 'formspress' ); }
	public function get_category(): string    { return 'contact'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'email'; }

	public function get_fields(): array {
		// Schema kept for backward-compat: any consumer that doesn't
		// understand `block_markup` (e.g. older exports) still sees
		// the field list.
		return [
			[ 'id' => 'name',    'type' => 'text',     'label' => __( 'Your name', 'formspress' ), 'required' => true ],
			[ 'id' => 'email',   'type' => 'email',    'label' => __( 'Email', 'formspress' ),     'required' => true ],
			[ 'id' => 'subject', 'type' => 'text',     'label' => __( 'Subject', 'formspress' ) ],
			[ 'id' => 'message', 'type' => 'textarea', 'label' => __( 'Message', 'formspress' ),   'required' => true ],
		];
	}

	public function get_actions(): array {
		return [
			[
				'type'     => 'email',
				'enabled'  => true,
				'to'       => get_option( 'admin_email', '' ),
				'subject'  => sprintf( __( 'New contact form submission: %s', 'formspress' ), '{field:subject}' ),
				'body'     => '',
				'reply_to' => '{field:email}',
			],
		];
	}

	public function get_block_markup(): ?string {
		$image_url = TB::placeholder( '1200x420', '2563eb', 'ffffff' );

		$inner = implode( "\n", [
			TB::image( $image_url, __( 'Contact', 'formspress' ), [ 'radius' => '16px' ] ),
			TB::heading( [
				'text'         => __( 'Contact us', 'formspress' ),
				'level'        => 2,
				'size'         => '30px',
				'weight'       => '700',
				'color'        => '#111827',
				'marginBottom' => '4px',
			] ),
			TB::description( [
				'text'         => __( 'We typically reply within one business day.', 'formspress' ),
				'color'        => '#6b7280',
				'size'         => '15px',
				'marginBottom' => '24px',
			] ),
			TB::field_text(     [ 'fieldId' => 'name',    'label' => __( 'Your name', 'formspress' ), 'required' => true, 'placeholder' => __( 'Jane Doe', 'formspress' ) ] ),
			TB::field_email(    [ 'fieldId' => 'email',   'label' => __( 'Email', 'formspress' ),     'required' => true, 'placeholder' => 'you@example.com' ] ),
			TB::field_text(     [ 'fieldId' => 'subject', 'label' => __( 'Subject', 'formspress' ),   'placeholder' => __( 'How can we help?', 'formspress' ) ] ),
			TB::field_textarea( [ 'fieldId' => 'message', 'label' => __( 'Message', 'formspress' ),   'required' => true, 'rows' => 6 ] ),
			TB::submit_button(  [ 'text' => __( 'Send message', 'formspress' ) ] ),
		] );

		return TB::group( [
			'inner'    => $inner,
			'bg'       => '#ffffff',
			'border'   => '#bfdbfe',
			'radius'   => '18px',
			'padding'  => '56px',
			'maxWidth' => '640px',
		] );
	}
}
