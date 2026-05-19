<?php

namespace FlowForms\Modules\Settings\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use WP_REST_Request;
use WP_REST_Response;

class GetSettings extends AbstractEndpoint {

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$defaults = [
			'default_from_name'  => get_bloginfo( 'name' ),
			'default_from_email' => get_option( 'admin_email' ),
			'recaptcha_enabled'  => false,
			'recaptcha_site_key' => '',
			'recaptcha_secret'   => '',
			'ip_logging'         => true,
			'retention_days'     => 0,
			'stripe_test_mode'      => false,
			'stripe_publishable_key' => '',
			'stripe_secret_key'     => '',
			'stripe_webhook_secret' => '',
		];

		$settings = get_option( 'flowforms_settings', [] );

		return $this->success( array_merge( $defaults, $settings ) );
	}
}
