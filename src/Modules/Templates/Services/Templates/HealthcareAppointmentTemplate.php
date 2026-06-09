<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

/**
 * Healthcare appointment request — soft blue clinical card, reassuring
 * tone, patient info + reason for visit + preferred provider.
 */
class HealthcareAppointmentTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'healthcare-appointment'; }
	public function get_label(): string       { return __( 'Healthcare appointment', 'formspress' ); }
	public function get_description(): string { return __( 'Patient appointment request — soft clinical blue, structured fields.', 'formspress' ); }
	public function get_category(): string    { return 'healthcare'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'plus-alt2'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'patient_name', 'type' => 'text',  'label' => __( 'Patient name', 'formspress' ), 'required' => true ],
			[ 'id' => 'dob',          'type' => 'text',  'label' => __( 'Date of birth', 'formspress' ), 'required' => true ],
			[ 'id' => 'email',        'type' => 'email', 'label' => __( 'Email', 'formspress' ),     'required' => true ],
			[ 'id' => 'phone',        'type' => 'text',  'label' => __( 'Phone', 'formspress' ),     'required' => true ],
			[ 'id' => 'provider',     'type' => 'select','label' => __( 'Preferred provider', 'formspress' ), 'options' => [ __( 'Any available', 'formspress' ), __( 'Dr. Smith', 'formspress' ), __( 'Dr. Patel', 'formspress' ), __( 'Dr. Garcia', 'formspress' ) ] ],
			[ 'id' => 'reason',       'type' => 'textarea', 'label' => __( 'Reason for visit', 'formspress' ), 'required' => true ],
		];
	}

	public function get_block_markup(): ?string {
		$providers = [
			[ 'label' => __( 'Any available', 'formspress' ), 'value' => 'any' ],
			[ 'label' => __( 'Dr. Smith', 'formspress' ),     'value' => 'smith' ],
			[ 'label' => __( 'Dr. Patel', 'formspress' ),     'value' => 'patel' ],
			[ 'label' => __( 'Dr. Garcia', 'formspress' ),    'value' => 'garcia' ],
		];

		$patient_row = TB::columns(
			TB::field_text( [ 'fieldId' => 'patient_name', 'label' => __( 'Patient name', 'formspress' ), 'required' => true ] ),
			TB::field_text( [ 'fieldId' => 'dob',          'label' => __( 'Date of birth', 'formspress' ), 'required' => true, 'placeholder' => 'YYYY-MM-DD' ] ),
			'16px'
		);
		$contact_row = TB::columns(
			TB::field_email( [ 'fieldId' => 'email', 'label' => __( 'Email', 'formspress' ), 'required' => true ] ),
			TB::field_text(  [ 'fieldId' => 'phone', 'label' => __( 'Phone', 'formspress' ), 'required' => true ] ),
			'16px'
		);

		$hero = TB::group( [
			'inner' => implode( "\n", [
				TB::heading( [
					'text' => __( 'Patient intake', 'formspress' ),
					'level' => 3, 'size' => '18px', 'weight' => '700', 'color' => '#bfdbfe',
					'marginBottom' => '18px',
				] ),
				TB::heading( [
					'text' => __( 'Request an appointment', 'formspress' ),
					'level' => 2, 'size' => '40px', 'weight' => '800', 'color' => '#ffffff',
					'marginBottom' => '12px',
				] ),
				TB::description( [
					'text' => __( 'Our team responds within one business day. For emergencies, call us directly.', 'formspress' ),
					'color' => '#dbeafe', 'size' => '16px', 'marginBottom' => '30px',
				] ),
				TB::group( [
					'inner' => implode( "\n", [
						TB::heading( [
							'text' => __( 'Secure request', 'formspress' ),
							'level' => 3, 'size' => '22px', 'weight' => '800', 'color' => '#1e3a8a',
							'marginBottom' => '6px',
						] ),
						TB::description( [
							'text' => __( 'Share patient details, preferred provider and visit reason in one structured form.', 'formspress' ),
							'color' => '#1d4ed8', 'size' => '14px', 'marginBottom' => '0',
						] ),
					] ),
					'bg' => '#ffffff',
					'radius' => '18px',
					'padding' => '26px',
				] ),
			] ),
			'gradient' => 'linear-gradient(145deg,#1e3a8a 0%,#2563eb 58%,#67e8f9 100%)',
			'fg' => '#ffffff',
			'radius' => '24px',
			'padding' => '44px',
		] );

		$form = TB::group( [
			'inner' => implode( "\n", [
				$patient_row,
				$contact_row,
				TB::field_select(   [ 'fieldId' => 'provider', 'label' => __( 'Preferred provider', 'formspress' ), 'options' => $providers ] ),
				TB::field_textarea( [ 'fieldId' => 'reason',   'label' => __( 'Reason for visit', 'formspress' ), 'rows' => 4, 'required' => true ] ),
				TB::submit_button(  [ 'text' => __( 'Request appointment', 'formspress' ), 'bg' => '#2563eb', 'fg' => '#ffffff', 'full' => true ] ),
			] ),
			'bg' => '#ffffff',
			'border' => '#bfdbfe',
			'radius' => '22px',
			'padding' => '38px',
		] );

		return TB::group( [
			'inner'   => TB::columns( $hero, $form, '24px' ),
			'gradient' => 'linear-gradient(135deg,#eff6ff 0%,#ecfeff 55%,#ffffff 100%)',
			'border'  => '#bfdbfe',
			'radius'  => '28px',
			'padding' => '28px',
			'maxWidth' => '1040px',
		] );
	}
}
