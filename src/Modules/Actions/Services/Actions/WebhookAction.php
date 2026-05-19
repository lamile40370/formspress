<?php

namespace FlowForms\Modules\Actions\Services\Actions;

use FlowForms\Modules\Actions\Services\AbstractAction;

class WebhookAction extends AbstractAction {

	public function get_id(): string {
		return 'webhook';
	}

	public function get_label(): string {
		return __( 'Send Webhook', 'flowforms' );
	}

	public function get_icon(): string {
		return 'link';
	}

	public function get_description(): string {
		return __( 'Send a POST/GET request to an external URL.', 'flowforms' );
	}

	public function get_fields(): array {
		return [
			[
				'key'         => 'url',
				'type'        => 'url',
				'label'       => __( 'Webhook URL', 'flowforms' ),
				'placeholder' => 'https://…',
				'default'     => '',
			],
			[
				'key'     => 'method',
				'type'    => 'select',
				'label'   => __( 'Method', 'flowforms' ),
				'options' => [
					[ 'value' => 'POST', 'label' => 'POST' ],
					[ 'value' => 'GET',  'label' => 'GET' ],
				],
				'default' => 'POST',
			],
			[
				'key'     => 'secret',
				'type'    => 'password',
				'label'   => __( 'Secret (HMAC)', 'flowforms' ),
				'default' => '',
			],
		];
	}

	public function run( array $config, array $entry, array $form ): void {
		$url = esc_url_raw( $config['url'] ?? '' );

		if ( empty( $url ) ) {
			return;
		}

		$payload = [
			'entry_id'   => $entry['id'],
			'form_id'    => $entry['form_id'],
			'form_title' => $form['title'],
			'created_at' => $entry['created_at'],
			'fields'     => [],
		];

		foreach ( $entry['values'] ?? [] as $value ) {
			$payload['fields'][ $value['field_id'] ] = [
				'label' => $value['field_label'],
				'value' => $value['field_value'],
			];
		}

		if ( ! empty( $config['custom_fields'] ) && is_array( $config['custom_fields'] ) ) {
			foreach ( $config['custom_fields'] as $key => $template ) {
				$payload[ $key ] = $this->resolve_variables( $template, $entry, $form );
			}
		}

		$method = strtoupper( $config['method'] ?? 'POST' );

		$args = [
			'method'  => $method,
			'headers' => [
				'Content-Type' => 'application/json',
			],
			'timeout' => 10,
		];

		if ( ! empty( $config['secret'] ) ) {
			$signature              = hash_hmac( 'sha256', wp_json_encode( $payload ), $config['secret'] );
			$args['headers']['X-FlowForms-Signature'] = $signature;
		}

		if ( 'GET' === $method ) {
			$url .= '?' . http_build_query( $payload );
		} else {
			$args['body'] = wp_json_encode( $payload );
		}

		wp_remote_request( $url, $args );
	}
}
