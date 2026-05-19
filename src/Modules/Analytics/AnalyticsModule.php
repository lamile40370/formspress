<?php

namespace FlowForms\Modules\Analytics;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Modules\Analytics\Services\AnalyticsCollector;
use FlowForms\Modules\Analytics\Services\AnalyticsRepository;
use FlowForms\Modules\Analytics\Services\VariantPicker;

class AnalyticsModule extends AbstractModule {

	public const CLEANUP_HOOK = 'flowforms_analytics_cleanup';

	public function get_id(): string {
		return 'analytics';
	}

	public function get_name(): string {
		return __( 'Analytics', 'flowforms' );
	}

	public function register_services( Container $container ): void {
		$container->singleton( AnalyticsRepository::class, fn() => new AnalyticsRepository() );
		$container->singleton( VariantPicker::class, fn() => new VariantPicker() );
		$container->singleton(
			AnalyticsCollector::class,
			fn( Container $c ) => new AnalyticsCollector(
				$c->get( AnalyticsRepository::class ),
				$c->get( \FlowForms\Modules\Forms\Services\FormRepository::class )
			)
		);
	}

	public function get_routes(): ?string {
		return Routes::class;
	}

	public function get_migrations_path(): ?string {
		return __DIR__ . '/Migrations';
	}

	public function boot(): void {
		/* Schedule daily cleanup job (retain 365 days by default). */
		if ( ! wp_next_scheduled( self::CLEANUP_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::CLEANUP_HOOK );
		}
		add_action( self::CLEANUP_HOOK, [ $this, 'run_cleanup' ] );
	}

	public function run_cleanup(): void {
		try {
			/** @var int $days */
			$days = (int) apply_filters( 'flowforms_analytics_retention_days', 365 );
			$days = max( 1, $days );

			$repo = \FlowForms\Plugin::instance()->container()->get( AnalyticsRepository::class );
			$repo->cleanup_older_than( $days );
		} catch ( \Throwable $e ) {
			/* Don't let WP-Cron explode on a failed cleanup. */
		}
	}
}
