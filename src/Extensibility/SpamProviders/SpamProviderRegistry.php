<?php

namespace FlowForms\Extensibility\SpamProviders;

use FlowForms\Extensibility\SpamProviders\Types\HcaptchaProvider;
use FlowForms\Extensibility\SpamProviders\Types\RecaptchaV3Provider;
use FlowForms\Extensibility\SpamProviders\Types\TurnstileProvider;

class SpamProviderRegistry {

	/** @var AbstractSpamProvider[] */
	private array $providers = [];

	public function __construct() {
		$this->register( new RecaptchaV3Provider() );
		$this->register( new TurnstileProvider() );
		$this->register( new HcaptchaProvider() );

		/**
		 * Allow third-party plugins to register custom FlowForms anti-spam providers.
		 *
		 * Example:
		 *     add_action( 'flowforms_register_spam_providers', function ( $registry ) {
		 *         $registry->register( new \MyPlugin\AkismetSpamProvider() );
		 *     } );
		 *
		 * @param SpamProviderRegistry $registry The spam provider registry instance.
		 */
		do_action( 'flowforms_register_spam_providers', $this );
	}

	public function register( AbstractSpamProvider $provider ): void {
		$this->providers[ $provider->get_id() ] = $provider;
	}

	public function get( string $id ): ?AbstractSpamProvider {
		return $this->providers[ $id ] ?? null;
	}

	/** @return AbstractSpamProvider[] */
	public function all(): array {
		return $this->providers;
	}

	public function get_active(): ?AbstractSpamProvider {
		$settings = get_option( 'flowforms_settings', [] );
		$active   = $settings['spam']['provider'] ?? 'none';
		if ( $active === 'none' || $active === '' ) {
			return null;
		}
		return $this->get( $active );
	}

	public function get_active_config(): array {
		$settings = get_option( 'flowforms_settings', [] );
		return $settings['spam']['config'] ?? [];
	}

	public function get_schema(): array {
		return array_values( array_map(
			fn( AbstractSpamProvider $p ) => [
				'id'          => $p->get_id(),
				'label'       => $p->get_label(),
				'description' => $p->get_description(),
				'settings'    => $p->get_settings_schema(),
				'tokenField'  => $p->get_token_field_name(),
			],
			$this->providers
		) );
	}
}
