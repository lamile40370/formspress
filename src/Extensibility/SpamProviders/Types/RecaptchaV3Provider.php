<?php

namespace FlowForms\Extensibility\SpamProviders\Types;

use FlowForms\Extensibility\SpamProviders\AbstractSpamProvider;

class RecaptchaV3Provider extends AbstractSpamProvider {

	public function get_id(): string {
		return 'recaptcha_v3';
	}

	public function get_label(): string {
		return __( 'Google reCAPTCHA v3', 'flowforms' );
	}

	public function get_description(): string {
		return __( 'Invisible score-based protection from Google. Recommended threshold: 0.5.', 'flowforms' );
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'site_key',   'type' => 'text',     'label' => __( 'Site key', 'flowforms' ) ],
			[ 'key' => 'secret_key', 'type' => 'password', 'label' => __( 'Secret key', 'flowforms' ) ],
			[ 'key' => 'threshold',  'type' => 'number',   'label' => __( 'Score threshold', 'flowforms' ), 'default' => 0.5, 'min' => 0, 'max' => 1, 'help' => __( 'Submissions scoring below this are rejected. 0.0 (bot) — 1.0 (human).', 'flowforms' ) ],
		];
	}

	public function get_frontend_assets( array $config ): array {
		$site_key = (string) ( $config['site_key'] ?? '' );
		if ( $site_key === '' ) {
			return [];
		}
		return [
			'scripts' => [ 'https://www.google.com/recaptcha/api.js?render=' . rawurlencode( $site_key ) ],
		];
	}

	public function render_widget( array $config ): string {
		return '<input type="hidden" name="' . esc_attr( $this->get_token_field_name() ) . '" class="ff-spam-token" data-provider="recaptcha_v3" />';
	}

	public function verify( string $token, array $config, string $ip ): true|string {
		$secret = (string) ( $config['secret_key'] ?? '' );
		if ( $secret === '' ) {
			/* No secret configured — fail open in dev, fail closed in prod. */
			return true;
		}
		if ( $token === '' ) {
			return __( 'Spam check failed: missing token.', 'flowforms' );
		}

		$response = wp_remote_post( 'https://www.google.com/recaptcha/api/siteverify', [
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

		$threshold = isset( $config['threshold'] ) ? (float) $config['threshold'] : 0.5;
		$score     = isset( $body['score'] ) ? (float) $body['score'] : 0.0;

		if ( $score < $threshold ) {
			return __( 'Submission flagged as suspicious. Please try again.', 'flowforms' );
		}

		return true;
	}
}
