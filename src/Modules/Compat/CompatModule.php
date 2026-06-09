<?php

namespace FlowForms\Modules\Compat;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Modules\Compat\Services\PolylangCompat;
use FlowForms\Modules\Compat\Services\TranslationManager;
use FlowForms\Modules\Compat\Services\WpmlCompat;
use FlowForms\Modules\Forms\Services\FormRepository;

/**
 * Third-party compatibility module.
 *
 * Currently covers translation tooling (WPML + Polylang). The shape is
 * generic so additional compat providers can plug in via:
 *   - `formspress_translate_string` filter (translate)
 *   - `formspress_register_string` action (register)
 */
class CompatModule extends AbstractModule {

	private ?Container $container = null;

	public function get_id(): string {
		return 'compat';
	}

	public function get_name(): string {
		return __( 'Compatibility', 'formspress' );
	}

	public function register_services( Container $container ): void {
		$this->container = $container;

		$container->singleton( WpmlCompat::class, fn() => new WpmlCompat() );
		$container->singleton( PolylangCompat::class, fn() => new PolylangCompat() );
	}

	public function boot(): void {
		// Late boot — providers self-check `is_active()` before subscribing.
		add_action( 'plugins_loaded', [ $this, 'boot_providers' ], 20 );

		// Auto-register form strings whenever a form is saved.
		add_action( 'flowforms_form_saved', [ $this, 'register_form_strings' ], 10, 1 );

		// Translate form data when it's read for the public renderer.
		add_filter( 'flowforms_get_form_for_render', [ $this, 'translate_form' ], 10, 1 );
	}

	public function boot_providers(): void {
		if ( ! $this->container ) {
			return;
		}

		try {
			$this->container->get( WpmlCompat::class )->register();
		} catch ( \Throwable ) {
			// Swallow — provider missing or threw, leave it inactive.
		}

		try {
			$this->container->get( PolylangCompat::class )->register();
		} catch ( \Throwable ) {
			// Same — silent skip.
		}
	}

	/**
	 * @param array<string, mixed>|int $form Form array or ID.
	 */
	public function register_form_strings( $form ): void {
		if ( is_int( $form ) && $this->container ) {
			try {
				$repo = $this->container->get( FormRepository::class );
			} catch ( \Throwable ) {
				return;
			}
			$loaded = $repo->get( $form );
			if ( ! is_array( $loaded ) ) {
				return;
			}
			$form = $loaded;
		}

		if ( ! is_array( $form ) ) {
			return;
		}

		TranslationManager::register_form_strings( $form );
	}

	/**
	 * @param mixed $form
	 * @return array<string, mixed>
	 */
	public function translate_form( $form ): array {
		if ( ! is_array( $form ) ) {
			return [];
		}
		return TranslationManager::translate_form( $form );
	}
}
