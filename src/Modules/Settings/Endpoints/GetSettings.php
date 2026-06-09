<?php

namespace FlowForms\Modules\Settings\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use WP_REST_Request;
use WP_REST_Response;

class GetSettings extends AbstractEndpoint {

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$defaults = [
			'default_from_name'                 => get_bloginfo( 'name' ),
			'default_from_email'                => get_option( 'admin_email' ),
			'default_reply_to'                  => '',
			'default_notification_to'           => get_option( 'admin_email' ),
			'recaptcha_enabled'                 => false,
			'recaptcha_site_key'                => '',
			'recaptcha_secret'                  => '',
			'ip_logging'                        => true,
			'retention_days'                    => 0,
			'default_submit_label'              => __( 'Submit', 'formspress' ),
			'default_success_action'            => 'message',
			'default_success_message'           => __( 'Thank you! Your submission has been received.', 'formspress' ),
			'default_redirect_url'              => '',
			'default_prev_label'                => __( 'Back', 'formspress' ),
			'default_next_label'                => __( 'Next', 'formspress' ),
			'stripe_test_mode'                  => false,
			'stripe_publishable_key'            => '',
			'stripe_secret_key'                 => '',
			'stripe_webhook_secret'             => '',
			'stripe_require_webhook_signature'  => true,
			'headless_mode'                     => false,
			'headless_require_token'            => false,
			'cors_origins'                      => '*',
			'ai_enabled'                        => false,
			'ai_provider'                       => 'openai',
			'ai_model'                          => 'gpt-5.5',
			'ai_api_key'                        => '',
			'ai_endpoint'                       => '',
			'ai_temperature'                    => 0.3,
		];

		$settings = array_diff_key( get_option( 'flowforms_settings', [] ), array_flip( [
			'default_enable_save_resume',
			'default_save_resume_label',
			'default_save_resume_email_subject',
			'default_save_resume_email_body',
		] ) );

		$settings = array_merge( $defaults, $settings );

		if ( ! apply_filters( 'flowforms_can_use_ai', false ) ) {
			$settings = array_merge( $settings, [
				'ai_enabled'     => false,
				'ai_provider'    => 'openai',
				'ai_model'       => '',
				'ai_api_key'     => '',
				'ai_endpoint'    => '',
				'ai_temperature' => 0.3,
			] );
		}

		return $this->success( $settings );
	}
}
