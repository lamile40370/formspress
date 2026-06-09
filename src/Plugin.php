<?php

namespace FlowForms;

use FlowForms\Cli\FormsPressCliCommands;
use FlowForms\Core\AdminPage;
use FlowForms\Core\Assets;
use FlowForms\Core\MigrationRunner;
use FlowForms\Core\ModuleRegistry;
use FlowForms\Hooks\HookRegistry;
use FlowForms\Modules\Entries\Services\EntryRepository;
use FlowForms\Modules\Forms\Services\FormRepository;
use FlowForms\Modules\Templates\Services\TemplateRegistry;

final class Plugin {

	private static ?self $instance = null;

	private Container $container;

	private function __construct() {
		$this->container = new Container();
	}

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	public function init(): void {
		$this->register_core_services();

		load_plugin_textdomain( 'formspress', false, dirname( FLOWFORMS_BASENAME ) . '/languages' );

		do_action( 'flowforms_core_services_registered', $this->container );

		$this->container->get( ModuleRegistry::class )->register_modules();

		$this->register_hooks();

		$this->container->get( ModuleRegistry::class )->boot_modules();

		add_action( 'admin_init', [ $this, 'maybe_run_migrations' ] );

		$this->maybe_register_cli();
	}

	private function register_core_services(): void {
		$this->container->instance( Container::class, $this->container );

		$this->container->singleton(
			HookRegistry::class,
			fn( Container $c ) => new HookRegistry( $c )
		);

		$this->container->singleton(
			MigrationRunner::class,
			fn( Container $c ) => new MigrationRunner()
		);

		$this->container->singleton(
			ModuleRegistry::class,
			fn( Container $c ) => new ModuleRegistry( $c, $c->get( HookRegistry::class ) )
		);

		$this->container->singleton(
			AdminPage::class,
			fn( Container $c ) => new AdminPage( $c->get( ModuleRegistry::class ) )
		);

		$this->container->singleton(
			Assets::class,
			fn( Container $c ) => new Assets( $c->get( ModuleRegistry::class ), $c )
		);
	}

	private function register_hooks(): void {
		$hook_registry = $this->container->get( HookRegistry::class );

		$hook_registry->register( AdminPage::class );
		$hook_registry->register( Assets::class );

		$this->discover_subscribers( $hook_registry, FLOWFORMS_DIR . 'src/Actions', 'FlowForms\\Actions' );
		$this->discover_subscribers( $hook_registry, FLOWFORMS_DIR . 'src/Filters', 'FlowForms\\Filters' );
	}

	private function discover_subscribers( HookRegistry $hook_registry, string $directory, string $base_namespace ): void {
		if ( ! is_dir( $directory ) ) {
			return;
		}

		$iterator = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator( $directory, \FilesystemIterator::SKIP_DOTS )
		);

		foreach ( $iterator as $file ) {
			if ( 'php' !== $file->getExtension() ) {
				continue;
			}

			$relative = str_replace( $directory, '', $file->getPathname() );
			$relative = ltrim( $relative, DIRECTORY_SEPARATOR );
			$relative = str_replace( DIRECTORY_SEPARATOR, '\\', $relative );
			$relative = preg_replace( '/\.php$/', '', $relative );

			$class = $base_namespace . '\\' . $relative;

			if ( class_exists( $class ) ) {
				$hook_registry->register( $class );
			}
		}
	}

	public function maybe_run_migrations(): void {
		$stored_version = get_option( 'flowforms_version', '0.0.0' );

		if ( version_compare( $stored_version, FLOWFORMS_VERSION, '<' ) ) {
			$this->container->get( MigrationRunner::class )->run_pending();
			update_option( 'flowforms_version', FLOWFORMS_VERSION );
		}
	}

	/**
	 * Register the `wp formspress …` CLI command when running under WP-CLI.
	 *
	 * We can't autowire `WP_CLI` itself, so we resolve service deps manually
	 * via the container. Bail silently if any dep is missing (e.g. a
	 * downstream module was hard-disabled).
	 */
	private function maybe_register_cli(): void {
		if ( ! ( defined( 'WP_CLI' ) && \WP_CLI ) ) {
			return;
		}

		if ( ! class_exists( FormsPressCliCommands::class ) ) {
			return;
		}

		try {
			$cmd = new FormsPressCliCommands(
				$this->container->get( FormRepository::class ),
				$this->container->get( EntryRepository::class ),
				$this->container->get( TemplateRegistry::class ),
			);
			\WP_CLI::add_command( 'formspress', $cmd );
		} catch ( \Throwable $e ) {
			// Soft fail so a missing module doesn't blow up the whole CLI.
			\WP_CLI::warning( 'FormsPress CLI failed to bootstrap: ' . $e->getMessage() );
		}
	}

	public function container(): Container {
		return $this->container;
	}
}
