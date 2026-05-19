<?php

namespace FlowForms\Modules\Actions\Services\Actions\Integrations;

use FlowForms\Modules\Actions\Services\AbstractAction;

class ConvertKitAction extends AbstractAction {

	public function get_id(): string {
		return 'convertkit';
	}

	public function get_label(): string {
		return __( 'ConvertKit — Subscribe', 'flowforms' );
	}

	public function get_icon(): string {
		return 'email';
	}

	public function get_description(): string {
		return __( 'Subscribe the submitter to a ConvertKit form.', 'flowforms' );
	}

	public function get_fields(): array {
		return [
			[
				'key'     => 'api_key',
				'type'    => 'password',
				'label'   => __( 'API key', 'flowforms' ),
				'help'    => __( 'ConvertKit account API key.', 'flowforms' ),
				'default' => '',
			],
			[
				'key'     => 'form_id',
				'type'    => 'text',
				'label'   => __( 'Form ID', 'flowforms' ),
				'help'    => __( 'ConvertKit form ID the subscriber is added to.', 'flowforms' ),
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
				'key'     => 'tag_ids',
				'type'    => 'text',
				'label'   => __( 'Tag IDs', 'flowforms' ),
				'help'    => __( 'Comma-separated ConvertKit tag IDs.', 'flowforms' ),
				'default' => '',
			],
		];
	}

	public function run( array $config, array $entry, array $form ): void {
		$api_key = trim( (string) ( $config['api_key'] ?? '' ) );
		$form_id = trim( (string) ( $config['form_id'] ?? '' ) );
		$email   = sanitize_email( $this->get_field_value( (string) ( $config['email_field'] ?? '' ), $entry ) );

		if ( '' === $api_key || '' === $form_id || '' === $email ) {
			return;
		}

		$body = [
			'api_key' => $api_key,
			'email'   => $email,
		];

		$first_name = $this->get_field_value( (string) ( $config['first_name_field'] ?? '' ), $entry );
		if ( '' !== $first_name ) {
			$body['first_name'] = $first_name;
		}

		if ( ! empty( $config['tag_ids'] ) ) {
			$tags = array_filter( array_map( 'trim', explode( ',', (string) $config['tag_ids'] ) ) );
			if ( ! empty( $tags ) ) {
				$body['tags'] = array_values( $tags );
			}
		}

		$url = 'https://api.convertkit.com/v3/forms/' . rawurlencode( $form_id ) . '/subscribe';

		$response = wp_remote_post( $url, [
			'timeout'  => 10,
			'blocking' => true,
			'headers'  => [
				'Content-Type' => 'application/json',
			],
			'body'     => wp_json_encode( $body ),
		] );

		if ( is_wp_error( $response ) ) {
			error_log( '[FlowForms][ConvertKit] HTTP error: ' . $response->get_error_message() );
			return;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 300 ) {
			error_log( '[FlowForms][ConvertKit] API returned ' . $code . ': ' . wp_remote_retrieve_body( $response ) );
		}
	}
}
