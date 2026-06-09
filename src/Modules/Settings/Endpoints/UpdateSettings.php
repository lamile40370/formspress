<?php

namespace FlowForms\Modules\Settings\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use WP_REST_Request;
use WP_REST_Response;

class UpdateSettings extends AbstractEndpoint {

	private const AI_MODELS = [
		'gpt-5.5',
		'gpt-5.5-pro',
		'gpt-5.4',
		'gpt-5.4-pro',
		'gpt-5.4-mini',
		'gpt-5.4-nano',
		'gpt-5-mini',
		'gpt-5-nano',
		'gpt-4.1',
		'claude-opus-4-7',
		'claude-sonnet-4-6',
		'claude-haiku-4-5-20251001',
		'deepseek-v4-pro',
		'deepseek-v4-flash',
		'gemini-3.1-pro-preview',
		'gemini-3-flash-preview',
		'gemini-3.1-flash-lite',
		'gemini-3.1-flash-lite-preview',
		'gemini-2.5-pro',
		'gemini-2.5-flash',
		'gpt-oss-120b',
		'gpt-oss-20b',
	];

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$body    = $request->get_json_params() ?: [];
		$current = get_option( 'flowforms_settings', [] );
		$current = array_diff_key( $current, array_flip( [
			'default_enable_save_resume',
			'default_save_resume_label',
			'default_save_resume_email_subject',
			'default_save_resume_email_body',
		] ) );

		$allowed_keys = [
			'default_from_name',
			'default_from_email',
			'default_reply_to',
			'default_notification_to',
			'recaptcha_enabled',
			'recaptcha_site_key',
			'recaptcha_secret',
			'ip_logging',
			'retention_days',
			'default_submit_label',
			'default_success_action',
			'default_success_message',
			'default_redirect_url',
			'default_prev_label',
			'default_next_label',
			'stripe_test_mode',
			'stripe_publishable_key',
			'stripe_secret_key',
			'stripe_webhook_secret',
			'stripe_require_webhook_signature',
			// Headless mode
			'headless_mode',
			'headless_require_token',
			'cors_origins',
		];

		if ( apply_filters( 'flowforms_can_use_ai', false ) ) {
			array_push(
				$allowed_keys,
				'ai_enabled',
				'ai_provider',
				'ai_model',
				'ai_api_key',
				'ai_endpoint',
				'ai_temperature'
			);
		}

		$sanitized = [];

		foreach ( $allowed_keys as $key ) {
			if ( ! array_key_exists( $key, $body ) ) {
				continue;
			}

			$sanitized[ $key ] = match ( $key ) {
				'default_from_name'                 => sanitize_text_field( $body[ $key ] ),
				'default_from_email'                => sanitize_email( $body[ $key ] ),
				'default_reply_to'                  => sanitize_email( $body[ $key ] ),
				'default_notification_to'           => sanitize_email( $body[ $key ] ),
				'recaptcha_enabled'                 => (bool) $body[ $key ],
				'ip_logging'                        => (bool) $body[ $key ],
				'retention_days'                    => absint( $body[ $key ] ),
				'default_success_action'            => in_array( $body[ $key ], [ 'message', 'redirect' ], true ) ? $body[ $key ] : 'message',
				'default_success_message'           => sanitize_textarea_field( $body[ $key ] ),
				'default_redirect_url'              => esc_url_raw( $body[ $key ] ),
				'stripe_test_mode'                  => (bool) $body[ $key ],
				'stripe_require_webhook_signature'  => (bool) $body[ $key ],
				'headless_mode'                     => (bool) $body[ $key ],
				'headless_require_token'            => (bool) $body[ $key ],
				'cors_origins'                      => sanitize_textarea_field( $body[ $key ] ),
				'ai_enabled'                        => (bool) $body[ $key ],
				'ai_provider'                       => in_array( $body[ $key ], [ 'openai', 'anthropic', 'deepseek', 'gemini', 'custom' ], true ) ? $body[ $key ] : 'openai',
				'ai_model'                          => in_array( $body[ $key ], self::AI_MODELS, true ) ? $body[ $key ] : 'gpt-5.5',
				'ai_api_key'                        => sanitize_text_field( $body[ $key ] ),
				'ai_endpoint'                       => esc_url_raw( $body[ $key ] ),
				'ai_temperature'                    => min( 2, max( 0, (float) $body[ $key ] ) ),
				default                             => sanitize_text_field( $body[ $key ] ),
			};
		}

		update_option( 'flowforms_settings', array_merge( $current, $sanitized ) );

		return $this->success( get_option( 'flowforms_settings', [] ) );
	}
}
