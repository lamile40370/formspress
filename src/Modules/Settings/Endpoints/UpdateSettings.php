<?php

namespace FlowForms\Modules\Settings\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use WP_REST_Request;
use WP_REST_Response;

class UpdateSettings extends AbstractEndpoint {

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$body    = $request->get_json_params() ?: [];
		$current = get_option( 'flowforms_settings', [] );

		$allowed_keys = [
			'default_from_name',
			'default_from_email',
			'recaptcha_enabled',
			'recaptcha_site_key',
			'recaptcha_secret',
			'ip_logging',
			'retention_days',
			'stripe_test_mode',
			'stripe_publishable_key',
			'stripe_secret_key',
			'stripe_webhook_secret',
			// Headless mode
			'headless_mode',
			'cors_origins',
		];

		$sanitized = [];

		foreach ( $allowed_keys as $key ) {
			if ( ! array_key_exists( $key, $body ) ) {
				continue;
			}

			$sanitized[ $key ] = match ( $key ) {
				'default_from_name'  => sanitize_text_field( $body[ $key ] ),
				'default_from_email' => sanitize_email( $body[ $key ] ),
				'recaptcha_enabled'  => (bool) $body[ $key ],
				'ip_logging'         => (bool) $body[ $key ],
				'retention_days'     => absint( $body[ $key ] ),
				'stripe_test_mode'   => (bool) $body[ $key ],
				'headless_mode'      => (bool) $body[ $key ],
				'cors_origins'       => sanitize_textarea_field( $body[ $key ] ),
				default              => sanitize_text_field( $body[ $key ] ),
			};
		}

		update_option( 'flowforms_settings', array_merge( $current, $sanitized ) );

		return $this->success( get_option( 'flowforms_settings', [] ) );
	}
}
