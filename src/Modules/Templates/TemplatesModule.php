<?php

namespace FlowForms\Modules\Templates;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Modules\Templates\Services\TemplateRegistry;

class TemplatesModule extends AbstractModule {

	public function get_id(): string {
		return 'templates';
	}

	public function get_name(): string {
		return __( 'Templates', 'formspress' );
	}

	public function register_services( Container $container ): void {
		$container->singleton( TemplateRegistry::class, fn() => new TemplateRegistry() );
	}

	public function get_routes(): ?string {
		return Routes::class;
	}
}
