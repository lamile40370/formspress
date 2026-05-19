<?php

namespace FlowForms\Modules\EmailTemplates;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Modules\EmailTemplates\Services\EmailTemplateRepository;

class EmailTemplatesModule extends AbstractModule {

	public function get_id(): string {
		return 'email-templates';
	}

	public function get_name(): string {
		return __( 'Email Templates', 'flowforms' );
	}

	public function register_services( Container $container ): void {
		$container->singleton( EmailTemplateRepository::class, fn() => new EmailTemplateRepository() );
	}

	public function get_routes(): ?string {
		return Routes::class;
	}

	public function get_migrations_path(): ?string {
		return __DIR__ . '/Migrations';
	}

	public function get_nav_items(): array {
		// Email templates live under the Tools parent — see ToolsModule.
		return [];
	}
}
