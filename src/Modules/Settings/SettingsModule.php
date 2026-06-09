<?php

namespace FlowForms\Modules\Settings;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Extensibility\StyleVariations\StyleVariationLoader;

class SettingsModule extends AbstractModule {

	public function get_id(): string {
		return 'settings';
	}

	public function get_name(): string {
		return __( 'Settings', 'formspress' );
	}

	public function register_services( Container $container ): void {
		$container->singleton( StyleVariationLoader::class, fn() => new StyleVariationLoader() );
	}

	public function get_routes(): ?string {
		return Routes::class;
	}

	public function get_nav_items(): array {
		return [
			[
				'label'       => __( 'Settings', 'formspress' ),
				'path'        => '/settings',
				'icon'        => 'admin-generic',
				'position'    => 90,
				'description' => __( 'Configure FormsPress global settings.', 'formspress' ),
				'children'    => [
					[
						'label' => __( 'Forms defaults', 'formspress' ),
						'path'  => '/settings/forms',
						'icon'  => 'feedback',
					],
					[
						'label' => __( 'Spam & security', 'formspress' ),
						'path'  => '/settings/spam',
						'icon'  => 'admin-generic',
					],
					[
						'label' => __( 'Email', 'formspress' ),
						'path'  => '/settings/email',
						'icon'  => 'email-alt',
					],
					[
						'label' => __( 'AI', 'formspress' ),
						'path'  => '/settings/ai',
						'icon'  => 'superhero',
					],
					[
						'label' => __( 'Headless API', 'formspress' ),
						'path'  => '/settings/headless',
						'icon'  => 'rest-api',
					],
				],
			],
		];
	}
}
