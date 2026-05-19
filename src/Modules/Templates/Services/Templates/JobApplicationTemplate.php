<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

/**
 * Job application — two-column hero (team photo + intro on the left,
 * structured form on the right). Demonstrates `core/columns` as the
 * root container plus a real image block.
 */
class JobApplicationTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'job-application'; }
	public function get_label(): string       { return __( 'Job application', 'flowforms' ); }
	public function get_description(): string { return __( 'Two-column hero — intro + photo on the left, application form on the right.', 'flowforms' ); }
	public function get_category(): string    { return 'careers'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'businessperson'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'full_name',    'type' => 'text',     'label' => __( 'Full name', 'flowforms' ),       'required' => true ],
			[ 'id' => 'email',        'type' => 'email',    'label' => __( 'Email', 'flowforms' ),           'required' => true ],
			[ 'id' => 'phone',        'type' => 'phone',    'label' => __( 'Phone', 'flowforms' ) ],
			[ 'id' => 'position',     'type' => 'text',     'label' => __( 'Position you are applying for', 'flowforms' ), 'required' => true ],
			[ 'id' => 'experience',   'type' => 'number',   'label' => __( 'Years of experience', 'flowforms' ) ],
			[ 'id' => 'cover_letter', 'type' => 'textarea', 'label' => __( 'Cover letter', 'flowforms' ),    'required' => true ],
		];
	}

	public function get_actions(): array {
		return [
			[
				'type'     => 'email',
				'enabled'  => true,
				'to'       => get_option( 'admin_email', '' ),
				'subject'  => sprintf( __( 'New application: %s', 'flowforms' ), '{field:position}' ),
				'body'     => '',
				'reply_to' => '{field:email}',
			],
		];
	}

	public function get_block_markup(): ?string {
		$image_url = TB::placeholder( '800x900', '0f172a', 'ffffff' );

		// Left column — image + intro text.
		$left = implode( "\n", [
			TB::image( $image_url, __( 'Our team', 'flowforms' ), [ 'radius' => '12px' ] ),
			TB::heading( [
				'text'         => __( 'Join our team', 'flowforms' ),
				'level'        => 2,
				'size'         => '32px',
				'weight'       => '800',
				'color'        => '#111827',
				'marginBottom' => '8px',
			] ),
			TB::description( [
				'text'         => __( 'We hire for curiosity and craft. Tell us about the work you are proud of — we read every application.', 'flowforms' ),
				'color'        => '#475569',
				'size'         => '15px',
				'marginBottom' => '0',
			] ),
		] );

		// Right column — form fields.
		$right = implode( "\n", [
			TB::field_text(     [ 'fieldId' => 'full_name',    'label' => __( 'Full name', 'flowforms' ), 'required' => true, 'placeholder' => __( 'Jane Doe', 'flowforms' ) ] ),
			TB::field_email(    [ 'fieldId' => 'email',        'label' => __( 'Email', 'flowforms' ),     'required' => true, 'placeholder' => 'jane@example.com' ] ),
			TB::field_text(     [ 'fieldId' => 'phone',        'label' => __( 'Phone', 'flowforms' ),     'placeholder' => '+1 (555) 123-4567' ] ),
			TB::field_text(     [ 'fieldId' => 'position',     'label' => __( 'Position you are applying for', 'flowforms' ), 'required' => true, 'placeholder' => __( 'Senior Engineer', 'flowforms' ) ] ),
			TB::field_number(   [ 'fieldId' => 'experience',   'label' => __( 'Years of experience', 'flowforms' ), 'min' => 0, 'max' => 50 ] ),
			TB::field_textarea( [ 'fieldId' => 'cover_letter', 'label' => __( 'Cover letter', 'flowforms' ), 'rows' => 6, 'required' => true ] ),
			TB::submit_button(  [ 'text' => __( 'Submit application', 'flowforms' ), 'bg' => '#4f46e5' ] ),
		] );

		return TB::group( [
			'inner'    => TB::columns( $left, $right, '48px' ),
			'bg'       => '#ffffff',
			'border'   => '#cbd5e1',
			'radius'   => '18px',
			'padding'  => '56px',
			'maxWidth' => '960px',
		] );
	}
}
