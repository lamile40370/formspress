<?php

namespace FlowForms\Extensibility\Storage;

use FlowForms\Extensibility\Storage\Types\LocalStorageProvider;

class StorageRegistry {

	/** @var AbstractStorageProvider[] */
	private array $providers = [];

	public function __construct() {
		$this->register( new LocalStorageProvider() );

		/**
		 * Allow third-party plugins to register custom FlowForms storage providers.
		 *
		 * Example:
		 *     add_action( 'flowforms_register_storage_providers', function ( $registry ) {
		 *         $registry->register( new \MyPlugin\S3StorageProvider() );
		 *     } );
		 *
		 * @param StorageRegistry $registry The storage registry instance.
		 */
		do_action( 'flowforms_register_storage_providers', $this );
	}

	public function register( AbstractStorageProvider $provider ): void {
		$this->providers[ $provider->get_id() ] = $provider;
	}

	public function get( string $id ): ?AbstractStorageProvider {
		return $this->providers[ $id ] ?? null;
	}

	/** @return AbstractStorageProvider[] */
	public function all(): array {
		return $this->providers;
	}

	public function get_active(): AbstractStorageProvider {
		$settings = get_option( 'flowforms_settings', [] );
		$active   = $settings['storage']['provider'] ?? 'local';
		$provider = $this->get( $active );
		return $provider ?: $this->get( 'local' );
	}

	public function get_active_config(): array {
		$settings = get_option( 'flowforms_settings', [] );
		return $settings['storage']['config'] ?? [];
	}

	public function get_schema(): array {
		return array_values( array_map(
			fn( AbstractStorageProvider $p ) => [
				'id'       => $p->get_id(),
				'label'    => $p->get_label(),
				'settings' => $p->get_settings_schema(),
			],
			$this->providers
		) );
	}
}
