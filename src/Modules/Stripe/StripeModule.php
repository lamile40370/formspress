<?php

namespace FlowForms\Modules\Stripe;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Modules\Actions\Services\ActionRegistry;
use FlowForms\Modules\Actions\Services\Actions\StripePaymentAction;

/**
 * Stripe payments module.
 *
 * Registers the StripePaymentAction with the central ActionRegistry on the
 * `flowforms_register_actions` hook so the rest of the system can pick it
 * up like any other action.
 *
 * Exposes its routes class (the webhook endpoint) for the standard
 * `rest_api_init` registration handled by ModuleRegistry.
 */
class StripeModule extends AbstractModule {

	public function get_id(): string {
		return 'stripe';
	}

	public function get_name(): string {
		return __( 'Stripe payments', 'flowforms' );
	}

	public function register_services( Container $container ): void {
		add_action( 'flowforms_register_actions', function ( ActionRegistry $registry ): void {
			$registry->register( new StripePaymentAction() );
		} );
	}

	public function get_routes(): ?string {
		return Routes::class;
	}
}
