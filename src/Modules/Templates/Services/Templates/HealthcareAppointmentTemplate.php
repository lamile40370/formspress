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
	public function get_label(): string       { return __( 'Healthcare appointment', 'flowforms' ); }
	public function get_description(): string { return __( 'Patient appointment request — soft clinical blue, structured fields.', 'flowforms' ); }
	public function get_category(): string    { return 'healthcare'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'plus-alt2'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'patient_name', 'type' => 'text',  'label' => __( 'Patient name', 'flowforms' ), 'required' => true ],
			[ 'id' => 'dob',          'type' => 'text',  'label' => __( 'Date of birth', 'flowforms' ), 'required' => true ],
			[ 'id' => 'email',        'type' => 'email', 'label' => __( 'Email', 'flowforms' ),     'required' => true ],
			[ 'id' => 'phone',        'type' => 'text',  'label' => __( 'Phone', 'flowforms' ),     'required' => true ],
			[ 'id' => 'provider',     'type' => 'select','label' => __( 'Preferred provider', 'flowforms' ), 'options' => [ __( 'Any available', 'flowforms' ), __( 'Dr. Smith', 'flowforms' ), __( 'Dr. Patel', 'flowforms' ), __( 'Dr. Garcia', 'flowforms' ) ] ],
			[ 'id' => 'reason',       'type' => 'textarea', 'label' => __( 'Reason for visit', 'flowforms' ), 'required' => true ],
		];
	}

	public function get_block_markup(): ?string {
		$providers = [
			[ 'label' => __( 'Any available', 'flowforms' ), 'value' => 'any' ],
			[ 'label' => __( 'Dr. Smith', 'flowforms' ),     'value' => 'smith' ],
			[ 'label' => __( 'Dr. Patel', 'flowforms' ),     'value' => 'patel' ],
			[ 'label' => __( 'Dr. Garcia', 'flowforms' ),    'value' => 'garcia' ],
		];

		$patient_row = TB::columns(
			TB::field_text( [ 'fieldId' => 'patient_name', 'label' => __( 'Patient name', 'flowforms' ), 'required' => true ] ),
			TB::field_text( [ 'fieldId' => 'dob',          'label' => __( 'Date of birth', 'flowforms' ), 'required' => true, 'placeholder' => 'YYYY-MM-DD' ] ),
			'16px'
		);
		$contact_row = TB::columns(
			TB::field_email( [ 'fieldId' => 'email', 'label' => __( 'Email', 'flowforms' ), 'required' => true ] ),
			TB::field_text(  [ 'fieldId' => 'phone', 'label' => __( 'Phone', 'flowforms' ), 'required' => true ] ),
			'16px'
		);

		$inner = implode( "\n", [
			TB::heading( [
				'text' => __( 'Request an appointment', 'flowforms' ),
				'level' => 2, 'size' => '28px', 'weight' => '700', 'color' => '#1e3a8a',
				'marginBottom' => '4px',
			] ),
			TB::description( [
				'text' => __( 'Our team responds within one business day. For emergencies, call us directly.', 'flowforms' ),
				'color' => '#1e40af', 'size' => '14px', 'marginBottom' => '24px',
			] ),
			$patient_row,
			$contact_row,
			TB::field_select(   [ 'fieldId' => 'provider', 'label' => __( 'Preferred provider', 'flowforms' ), 'options' => $providers ] ),
			TB::field_textarea( [ 'fieldId' => 'reason',   'label' => __( 'Reason for visit', 'flowforms' ), 'rows' => 4, 'required' => true ] ),
			TB::submit_button(  [ 'text' => __( 'Request appointment', 'flowforms' ), 'bg' => '#2563eb', 'fg' => '#ffffff' ] ),
		] );

		return TB::group( [
			'inner'   => $inner,
			'bg'      => '#f8fbff',
			'border'  => '#bfdbfe',
			'radius'  => '18px',
			'padding' => '56px',
			'maxWidth' => '700px',
		] );
	}
}
