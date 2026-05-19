<?php

namespace FlowForms\Modules\Stripe;

use FlowForms\Core\AbstractRoutes;
use FlowForms\Modules\Stripe\Endpoints\StripeWebhook;

class Routes extends AbstractRoutes {

	// Constructor inherited from AbstractRoutes (protected Container $container).

	public function register(): void {
		register_rest_route(
			'flowforms/v1',
			'/stripe/webhook',
			[
				'methods'             => 'POST',
				'permission_callback' => '__return_true',
				'callback'            => $this->container->get( StripeWebhook::class ),
			]
		);
	}
}
