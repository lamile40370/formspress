<?php

namespace FlowForms\Modules\Webhooks;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Modules\Webhooks\Services\WebhookDispatcher;
use FlowForms\Modules\Webhooks\Services\WebhookEventBridge;
use FlowForms\Modules\Webhooks\Services\WebhookSubscriptionRepository;

class WebhooksModule extends AbstractModule {

	public function get_id(): string {
		return 'webhooks';
	}

	public function get_name(): string {
		return __( 'Outgoing Webhooks', 'flowforms' );
	}

	public function register_services( Container $container ): void {
		$container->singleton( WebhookSubscriptionRepository::class, fn() => new WebhookSubscriptionRepository() );

		$container->singleton(
			WebhookDispatcher::class,
			fn( Container $c ) => new WebhookDispatcher( $c->get( WebhookSubscriptionRepository::class ) )
		);

		$container->singleton(
			WebhookEventBridge::class,
			fn( Container $c ) => new WebhookEventBridge( $c->get( WebhookDispatcher::class ) )
		);
	}

	public function get_routes(): ?string {
		return Routes::class;
	}

	public function get_migrations_path(): ?string {
		return __DIR__ . '/Migrations';
	}

	public function get_subscribers(): array {
		return [
			WebhookEventBridge::class,
		];
	}

	public function get_nav_items(): array {
		// Webhooks live under the Integrations parent now — see
		// IntegrationsModule. Keep this empty so the top-level sidebar
		// stays tidy.
		return [];
	}
}
