<?php

namespace FlowForms\Modules\Actions\Services\Actions\Integrations;

use FlowForms\Modules\Actions\Services\AbstractAction;

class BrevoAction extends AbstractAction {

	public function get_id(): string {
		return 'brevo';
	}

	public function get_label(): string {
		return __( 'Brevo — Add contact', 'flowforms' );
	}

	public function get_icon(): string {
		return 'email';
	}

	public function get_description(): string {
		return __( 'Add or update a Brevo (formerly Sendinblue) contact.', 'flowforms' );
	}

	public function get_fields(): array {
		return [
			[
				'key'     => 'api_key',
				'type'    => 'password',
				'label'   => __( 'API key', 'flowforms' ),
				'help'    => __( 'Brevo v3 API key.', 'flowforms' ),
				'default' => '',
			],
			[
				'key'     => 'list_ids',
				'type'    => 'text',
				'label'   => __( 'List IDs', 'flowforms' ),
				'help'    => __( 'Optional. Comma-separated list IDs to add the contact to.', 'flowforms' ),
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
				'key'     => 'update_enabled',
				'type'    => 'toggle',
				'label'   => __( 'Update contact if it already exists', 'flowforms' ),
				'default' => true,
			],
		];
	}

	public function run( array $config, array $entry, array $form ): void {
		$api_key = trim( (string) ( $config['api_key'] ?? '' ) );
		$email   = sanitize_email( $this->get_field_value( (string) ( $config['email_field'] ?? '' ), $entry ) );

		if ( '' === $api_key || '' === $email ) {
			return;
		}

		$attributes = [];
		$first      = $this->get_field_value( (string) ( $config['first_name_field'] ?? '' ), $entry );
		$last       = $this->get_field_value( (string) ( $config['last_name_field'] ?? '' ), $entry );
		if ( '' !== $first ) {
			$attributes['FIRSTNAME'] = $first;
		}
		if ( '' !== $last ) {
			$attributes['LASTNAME'] = $last;
		}

		$body = [
			'email'          => $email,
			'updateEnabled'  => ! isset( $config['update_enabled'] ) || ! empty( $config['update_enabled'] ),
		];

		if ( ! empty( $attributes ) ) {
			$body['attributes'] = $attributes;
		}

		if ( ! empty( $config['list_ids'] ) ) {
			$list_ids = array_filter( array_map(
				static fn( $id ) => (int) trim( $id ),
				explode( ',', (string) $config['list_ids'] )
			) );
			if ( ! empty( $list_ids ) ) {
				$body['listIds'] = array_values( $list_ids );
			}
		}

		$response = wp_remote_post( 'https://api.brevo.com/v3/contacts', [
			'timeout'  => 10,
			'blocking' => true,
			'headers'  => [
				'api-key'      => $api_key,
				'Content-Type' => 'application/json',
				'Accept'       => 'application/json',
			],
			'body'     => wp_json_encode( $body ),
		] );

		if ( is_wp_error( $response ) ) {
			error_log( '[FlowForms][Brevo] HTTP error: ' . $response->get_error_message() );
			return;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 300 ) {
			error_log( '[FlowForms][Brevo] API returned ' . $code . ': ' . wp_remote_retrieve_body( $response ) );
		}
	}
}
