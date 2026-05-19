<?php

namespace FlowForms\Modules\Actions\Services\Actions\Integrations;

use FlowForms\Modules\Actions\Services\AbstractAction;

class ActiveCampaignAction extends AbstractAction {

	public function get_id(): string {
		return 'activecampaign';
	}

	public function get_label(): string {
		return __( 'ActiveCampaign — Add contact', 'flowforms' );
	}

	public function get_icon(): string {
		return 'email';
	}

	public function get_description(): string {
		return __( 'Create or update an ActiveCampaign contact.', 'flowforms' );
	}

	public function get_fields(): array {
		return [
			[
				'key'         => 'api_url',
				'type'        => 'url',
				'label'       => __( 'API URL', 'flowforms' ),
				'placeholder' => 'https://YOUR-ACCOUNT.api-us1.com',
				'default'     => '',
			],
			[
				'key'     => 'api_key',
				'type'    => 'password',
				'label'   => __( 'API key', 'flowforms' ),
				'default' => '',
			],
			[
				'key'     => 'list_id',
				'type'    => 'text',
				'label'   => __( 'List ID', 'flowforms' ),
				'help'    => __( 'Optional. If set, the contact is also added to this list.', 'flowforms' ),
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
				'key'     => 'first_name_field',
				'type'    => 'text',
				'label'   => __( 'First name field ID', 'flowforms' ),
				'help'    => __( 'Optional.', 'flowforms' ),
				'default' => '',
			],
			[
				'key'     => 'last_name_field',
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
				'key'     => 'tags',
				'type'    => 'text',
				'label'   => __( 'Tags', 'flowforms' ),
				'help'    => __( 'Comma-separated. Reserved for future use.', 'flowforms' ),
				'default' => '',
			],
		];
	}

	public function run( array $config, array $entry, array $form ): void {
		$api_url = untrailingslashit( esc_url_raw( $config['api_url'] ?? '' ) );
		$api_key = trim( (string) ( $config['api_key'] ?? '' ) );
		$email   = sanitize_email( $this->get_field_value( (string) ( $config['email_field'] ?? '' ), $entry ) );

		if ( '' === $api_url || '' === $api_key || '' === $email ) {
			return;
		}

		$contact = [ 'email' => $email ];

		$first = $this->get_field_value( (string) ( $config['first_name_field'] ?? '' ), $entry );
		$last  = $this->get_field_value( (string) ( $config['last_name_field'] ?? '' ), $entry );
		$phone = $this->get_field_value( (string) ( $config['phone_field'] ?? '' ), $entry );

		if ( '' !== $first ) {
			$contact['firstName'] = $first;
		}
		if ( '' !== $last ) {
			$contact['lastName'] = $last;
		}
		if ( '' !== $phone ) {
			$contact['phone'] = $phone;
		}

		$headers = [
			'Api-Token'    => $api_key,
			'Content-Type' => 'application/json',
			'Accept'       => 'application/json',
		];

		$response = wp_remote_post( $api_url . '/api/3/contact/sync', [
			'timeout'  => 10,
			'blocking' => true,
			'headers'  => $headers,
			'body'     => wp_json_encode( [ 'contact' => $contact ] ),
		] );

		if ( is_wp_error( $response ) ) {
			error_log( '[FlowForms][ActiveCampaign] HTTP error: ' . $response->get_error_message() );
			return;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 300 ) {
			error_log( '[FlowForms][ActiveCampaign] contact/sync returned ' . $code . ': ' . wp_remote_retrieve_body( $response ) );
			return;
		}

		$list_id = trim( (string) ( $config['list_id'] ?? '' ) );
		if ( '' === $list_id ) {
			return;
		}

		$decoded    = json_decode( wp_remote_retrieve_body( $response ), true );
		$contact_id = $decoded['contact']['id'] ?? null;

		if ( null === $contact_id ) {
			error_log( '[FlowForms][ActiveCampaign] contact/sync response missing contact.id' );
			return;
		}

		$list_response = wp_remote_post( $api_url . '/api/3/contactLists', [
			'timeout'  => 10,
			'blocking' => true,
			'headers'  => $headers,
			'body'     => wp_json_encode( [
				'contactList' => [
					'list'    => $list_id,
					'contact' => $contact_id,
					'status'  => 1,
				],
			] ),
		] );

		if ( is_wp_error( $list_response ) ) {
			error_log( '[FlowForms][ActiveCampaign] contactLists HTTP error: ' . $list_response->get_error_message() );
			return;
		}

		$list_code = (int) wp_remote_retrieve_response_code( $list_response );
		if ( $list_code < 200 || $list_code >= 300 ) {
			error_log( '[FlowForms][ActiveCampaign] contactLists returned ' . $list_code . ': ' . wp_remote_retrieve_body( $list_response ) );
		}
	}
}
