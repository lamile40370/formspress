<?php

namespace FlowForms\Core;

use FlowForms\Container;
use FlowForms\Hooks\HookRegistry;

class ModuleRegistry {

	/** @var AbstractModule[] */
	private array $modules = [];

	public function __construct(
		private readonly Container $container,
		private readonly HookRegistry $hook_registry,
	) {}

	public function register_modules(): void {
		/** @var string[] $module_classes */
		$module_classes = apply_filters( 'flowforms_modules', [
			\FlowForms\Modules\Dashboard\DashboardModule::class,
			\FlowForms\Modules\Forms\FormsModule::class,
			\FlowForms\Modules\Entries\EntriesModule::class,
			\FlowForms\Modules\Actions\ActionsModule::class,
			\FlowForms\Modules\Templates\TemplatesModule::class,
			\FlowForms\Modules\Settings\SettingsModule::class,
			\FlowForms\Modules\FieldTypes\FieldTypesModule::class,
			\FlowForms\Modules\SpamProviders\SpamProvidersModule::class,
			\FlowForms\Modules\Blocks\BlocksModule::class,
			\FlowForms\Modules\Bindings\BindingsModule::class,
			\FlowForms\Modules\Compat\CompatModule::class,
			\FlowForms\Modules\Privacy\PrivacyModule::class,
			\FlowForms\Modules\Integrations\IntegrationsModule::class,
			\FlowForms\Modules\Tools\ToolsModule::class,
		] );

		foreach ( $module_classes as $class ) {
			if ( ! class_exists( $class ) ) {
				continue;
			}

			/** @var AbstractModule $module */
			$module = new $class();
			$this->modules[ $module->get_id() ] = $module;

			do_action( 'flowforms_registering_module', $module, $this->container );

			$module->register_services( $this->container );

			foreach ( $module->get_subscribers() as $subscriber_class ) {
				$this->hook_registry->register( $subscriber_class );
			}

			$routes_class = $module->get_routes();
			if ( $routes_class ) {
				add_action( 'rest_api_init', function () use ( $routes_class ) {
					( new $routes_class( $this->container ) )->register();
				} );
			}
		}

		do_action( 'flowforms_modules_registered', $this->modules, $this->container );
	}

	public function boot_modules(): void {
		foreach ( $this->modules as $module ) {
			$module->boot();
		}
	}

	/** @return AbstractModule[] */
	public function get_modules(): array {
		return $this->modules;
	}

	/** @return array<int, array<string, mixed>> */
	public function get_all_nav_items(): array {
		$items = [];

		foreach ( $this->modules as $module ) {
			$items = array_merge( $items, $module->get_nav_items() );
		}

		$items = apply_filters( 'flowforms_nav_items', $items, $this->modules );

		usort( $items, fn( $a, $b ) => ( $a['position'] ?? 50 ) <=> ( $b['position'] ?? 50 ) );

		return $items;
	}

	/** @return string[] */
	public function get_all_migration_paths(): array {
		$paths = [];

		foreach ( $this->modules as $module ) {
			$path = $module->get_migrations_path();
			if ( $path && is_dir( $path ) ) {
				$paths[] = $path;
			}
		}

		return $paths;
	}
}
