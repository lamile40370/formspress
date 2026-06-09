<?php

namespace FlowForms\Modules\SpamProviders;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Extensibility\SpamProviders\SpamProviderRegistry;
use FlowForms\Extensibility\Storage\StorageRegistry;

class SpamProvidersModule extends AbstractModule {

	public function get_id(): string {
		return 'spam_providers';
	}

	public function get_name(): string {
		return __( 'Anti-spam', 'formspress' );
	}

	public function register_services( Container $container ): void {
		$container->singleton( SpamProviderRegistry::class, fn() => new SpamProviderRegistry() );
		$container->singleton( StorageRegistry::class, fn() => new StorageRegistry() );
	}

	public function get_routes(): ?string {
		return Routes::class;
	}
}
