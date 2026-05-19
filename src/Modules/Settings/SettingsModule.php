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
		return __( 'Settings', 'flowforms' );
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
				'label'       => __( 'Settings', 'flowforms' ),
				'path'        => '/settings',
				'icon'        => 'admin-generic',
				'position'    => 90,
				'description' => __( 'Configure FormsPress global settings.', 'flowforms' ),
				'children'    => [
					[
						'label' => __( 'General', 'flowforms' ),
						'path'  => '/settings',
						'icon'  => 'admin-generic',
					],
					[
						'label' => __( 'Forms defaults', 'flowforms' ),
						'path'  => '/settings/forms',
						'icon'  => 'feedback',
					],
					[
						'label' => __( 'Spam & security', 'flowforms' ),
						'path'  => '/settings/spam',
						'icon'  => 'admin-generic',
					],
					[
						'label' => __( 'Email', 'flowforms' ),
						'path'  => '/settings/email',
						'icon'  => 'email-alt',
					],
					[
						'label' => __( 'Headless API', 'flowforms' ),
						'path'  => '/settings/headless',
						'icon'  => 'rest-api',
					],
				],
			],
		];
	}
}
