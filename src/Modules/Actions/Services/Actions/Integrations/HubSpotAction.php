<?php

namespace FlowForms\Modules\Actions\Services\Actions\Integrations;

use FlowForms\Modules\Actions\Services\AbstractAction;

class HubSpotAction extends AbstractAction {

	public function get_id(): string {
		return 'hubspot';
	}

	public function get_label(): string {
		return __( 'HubSpot — Create contact', 'flowforms' );
	}

	public function get_icon(): string {
		return 'link';
	}

	public function get_description(): string {
		return __( 'Create a HubSpot contact via a private app token.', 'flowforms' );
	}

	public function get_fields(): array {
		return [
			[
				'key'     => 'access_token',
				'type'    => 'password',
				'label'   => __( 'Private app access token', 'flowforms' ),
				'help'    => __( 'HubSpot private app token with crm.objects.contacts.write scope.', 'flowforms' ),
				'default' => '',
			],
			[
				'key'         => 'email_field',
				'type'        => 'text',
				'label'       => __( 'Email field ID', 'flowforms' ),
				'placeholder' => 'email',
				'default'     => '',
			],
			[
				'key'     => 'firstname_field',
				'type'    => 'text',
				'label'   => __( 'First name field ID', 'flowforms' ),
				'help'    => __( 'Optional.', 'flowforms' ),
				'default' => '',
			],
			[
				'key'     => 'lastname_field',
				'type'    => 'text',
				'label'   => __( 'Last name field ID', 'flowforms' ),
				'help'    => __( 'Optional.', 'flowforms' ),
				'default' => '',
			],
			[
				'key'     => 'phone_field',
				'type'    => 'text',
				'label'   => __( 'Phone field ID', 'flowforms' ),
				'help'    => __( 'Optional.', 'flowforms' ),
				'default' => '',
			],
			[
				'key'     => 'company_field',
				'type'    => 'text',
				'label'   => __( 'Company field ID', 'flowforms' ),
				'help'    => __( 'Optional.', 'flowforms' ),
				'default' => '',
			],
			[
				'key'     => 'lifecycle_stage',
				'type'    => 'select',
				'label'   => __( 'Lifecycle stage', 'flowforms' ),
				'options' => [
					[ 'value' => 'lead',                   'label' => __( 'Lead', 'flowforms' ) ],
					[ 'value' => 'marketingqualifiedlead', 'label' => __( 'Marketing qualified lead', 'flowforms' ) ],
					[ 'value' => 'salesqualifiedlead',     'label' => __( 'Sales qualified lead', 'flowforms' ) ],
					[ 'value' => 'customer',               'label' => __( 'Customer', 'flowforms' ) ],
					[ 'value' => 'other',                  'label' => __( 'Other', 'flowforms' ) ],
				],
				'default' => 'lead',
			],
		];
	}

	public function run( array $config, array $entry, array $form ): void {
		$token = trim( (string) ( $config['access_token'] ?? '' ) );
		$email = sanitize_email( $this->get_field_value( (string) ( $config['email_field'] ?? '' ), $entry ) );

		if ( '' === $token || '' === $email ) {
			return;
		}

		$properties = [ 'email' => $email ];

		$firstname = $this->get_field_value( (string) ( $config['firstname_field'] ?? '' ), $entry );
		$lastname  = $this->get_field_value( (string) ( $config['lastname_field'] ?? '' ), $entry );
		$phone     = $this->get_field_value( (string) ( $config['phone_field'] ?? '' ), $entry );
		$company   = $this->get_field_value( (string) ( $config['company_field'] ?? '' ), $entry );

		if ( '' !== $firstname ) {
			$properties['firstname'] = $firstname;
		}
		if ( '' !== $lastname ) {
			$properties['lastname'] = $lastname;
		}
		if ( '' !== $phone ) {
			$properties['phone'] = $phone;
		}
		if ( '' !== $company ) {
			$properties['company'] = $company;
		}

		$lifecycle = (string) ( $config['lifecycle_stage'] ?? 'lead' );
		if ( '' !== $lifecycle ) {
			$properties['lifecyclestage'] = $lifecycle;
		}

		$response = wp_remote_post( 'https://api.hubapi.com/crm/v3/objects/contacts', [
			'timeout'  => 10,
			'blocking' => true,
			'headers'  => [
				'Authorization' => 'Bearer ' . $token,
				'Content-Type'  => 'application/json',
			],
			'body'     => wp_json_encode( [ 'properties' => $properties ] ),
		] );

		if ( is_wp_error( $response ) ) {
			error_log( '[FlowForms][HubSpot] HTTP error: ' . $response->get_error_message() );
			return;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 300 ) {
			error_log( '[FlowForms][HubSpot] API returned ' . $code . ': ' . wp_remote_retrieve_body( $response ) );
		}
	}
}
