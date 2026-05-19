<?php

namespace FlowForms\Modules\Forms;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Modules\Forms\Services\FormRepository;

class FormsModule extends AbstractModule {

	public function get_id(): string {
		return 'forms';
	}

	public function get_name(): string {
		return __( 'Forms', 'flowforms' );
	}

	public function register_services( Container $container ): void {
		$container->singleton( FormRepository::class, fn() => new FormRepository() );
	}

	public function get_routes(): ?string {
		return Routes::class;
	}

	public function get_migrations_path(): ?string {
		return __DIR__ . '/Migrations';
	}

	public function get_nav_items(): array {
		return [
			[
				'label'       => __( 'Forms', 'flowforms' ),
				'path'        => '/forms',
				'icon'        => 'feedback',
				'position'    => 20,
				'description' => __( 'Create and manage your forms.', 'flowforms' ),
				'children'    => [
					[
						'label' => __( 'All forms', 'flowforms' ),
						'path'  => '/forms',
						'icon'  => 'feedback',
					],
					[
						'label' => __( 'Templates', 'flowforms' ),
						'path'  => '/forms/templates',
						'icon'  => 'list-view',
					],
				],
			],
		];
	}
}
