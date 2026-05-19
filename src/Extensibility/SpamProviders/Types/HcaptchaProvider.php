<?php

namespace FlowForms\Extensibility\SpamProviders\Types;

use FlowForms\Extensibility\SpamProviders\AbstractSpamProvider;

class HcaptchaProvider extends AbstractSpamProvider {

	public function get_id(): string {
		return 'hcaptcha';
	}

	public function get_label(): string {
		return __( 'hCaptcha', 'flowforms' );
	}

	public function get_description(): string {
		return __( 'Privacy-respecting CAPTCHA service.', 'flowforms' );
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'site_key',   'type' => 'text',     'label' => __( 'Site key', 'flowforms' ) ],
			[ 'key' => 'secret_key', 'type' => 'password', 'label' => __( 'Secret key', 'flowforms' ) ],
		];
	}

	public function get_frontend_assets( array $config ): array {
		return [
			'scripts' => [ 'https://js.hcaptcha.com/1/api.js' ],
		];
	}

	public function render_widget( array $config ): string {
		$site_key = esc_attr( (string) ( $config['site_key'] ?? '' ) );
		return '<div class="h-captcha ff-spam-widget" data-sitekey="' . $site_key . '" data-callback="ffHcaptchaCallback"></div>'
			. '<input type="hidden" name="' . esc_attr( $this->get_token_field_name() ) . '" class="ff-spam-token" data-provider="hcaptcha" />';
	}

	public function verify( string $token, array $config, string $ip ): true|string {
		$secret = (string) ( $config['secret_key'] ?? '' );
		if ( $secret === '' ) {
			return true;
		}
		if ( $token === '' ) {
			return __( 'Spam check failed: missing token.', 'flowforms' );
		}

		$response = wp_remote_post( 'https://api.hcaptcha.com/siteverify', [
			'timeout' => 10,
			'body'    => [
				'secret'   => $secret,
				'response' => $token,
				'remoteip' => $ip,
			],
		] );

		if ( is_wp_error( $response ) ) {
			return __( 'Spam check failed: provider unreachable.', 'flowforms' );
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $body ) || empty( $body['success'] ) ) {
			return __( 'Spam check failed.', 'flowforms' );
		}

		return true;
	}
}
