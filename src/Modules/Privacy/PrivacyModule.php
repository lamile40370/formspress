<?php

namespace FlowForms\Modules\Privacy;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Modules\Privacy\Services\DataEraser;
use FlowForms\Modules\Privacy\Services\DataExporter;
use FlowForms\Modules\Privacy\Services\PrivacyPolicyContent;

/**
 * GDPR / privacy module.
 *
 * Wires into the three WordPress privacy hooks:
 *   - `wp_privacy_personal_data_exporters` — DataExporter
 *   - `wp_privacy_personal_data_erasers` — DataEraser
 *   - `admin_init` (priority 10) — PrivacyPolicyContent suggestion
 */
class PrivacyModule extends AbstractModule {

	private ?Container $container = null;

	public function get_id(): string {
		return 'privacy';
	}

	public function get_name(): string {
		return __( 'Privacy', 'flowforms' );
	}

	public function register_services( Container $container ): void {
		$this->container = $container;

		$container->singleton( DataExporter::class, fn() => new DataExporter() );
		$container->singleton( DataEraser::class, fn() => new DataEraser() );
		$container->singleton( PrivacyPolicyContent::class, fn() => new PrivacyPolicyContent() );
	}

	public function boot(): void {
		add_filter( 'wp_privacy_personal_data_exporters', [ $this, 'register_exporter' ], 10, 1 );
		add_filter( 'wp_privacy_personal_data_erasers', [ $this, 'register_eraser' ], 10, 1 );
		add_action( 'admin_init', [ $this, 'register_policy_content' ] );
	}

	/**
	 * @param array<string, array{exporter_friendly_name: string, callback: callable}> $exporters
	 * @return array<string, array{exporter_friendly_name: string, callback: callable}>
	 */
	public function register_exporter( array $exporters ): array {
		if ( ! $this->container ) {
			return $exporters;
		}
		try {
			return $this->container->get( DataExporter::class )->register( $exporters );
		} catch ( \Throwable ) {
			return $exporters;
		}
	}

	/**
	 * @param array<string, array{eraser_friendly_name: string, callback: callable}> $erasers
	 * @return array<string, array{eraser_friendly_name: string, callback: callable}>
	 */
	public function register_eraser( array $erasers ): array {
		if ( ! $this->container ) {
			return $erasers;
		}
		try {
			return $this->container->get( DataEraser::class )->register( $erasers );
		} catch ( \Throwable ) {
			return $erasers;
		}
	}

	public function register_policy_content(): void {
		if ( ! $this->container ) {
			return;
		}
		try {
			$this->container->get( PrivacyPolicyContent::class )->register();
		} catch ( \Throwable ) {
			// silent
		}
	}
}
