<?php

namespace FlowForms\Modules\Compat\Services;

/**
 * WPML compatibility provider.
 *
 * Bridges FormsPress translation events to WPML's String Translation API:
 *   - `flowforms_register_string` → `wpml_register_single_string`
 *   - `flowforms_translate_string` → `wpml_translate_single_string`
 *
 * Activates only when WPML String Translation is loaded.
 */
class WpmlCompat {

	public function register(): void {
		if ( ! $this->is_active() ) {
			return;
		}

		add_action( 'flowforms_register_string', [ $this, 'register_string' ], 10, 3 );
		add_filter( 'flowforms_translate_string', [ $this, 'translate_string' ], 10, 4 );
		add_filter( 'flowforms_active_compat_providers', [ $this, 'declare_provider' ] );
	}

	public function is_active(): bool {
		return defined( 'WPML_ST_VERSION' ) || has_filter( 'wpml_translate_single_string' );
	}

	public function register_string( string $value, string $domain, string $name ): void {
		do_action( 'wpml_register_single_string', $domain, $name, $value );
	}

	/**
	 * @param string|null $translated
	 */
	public function translate_string( $translated, string $value, string $domain, string $name ): ?string {
		if ( null !== $translated ) {
			return $translated;
		}

		/** @var string $out */
		$out = apply_filters( 'wpml_translate_single_string', $value, $domain, $name );

		return is_string( $out ) ? $out : $value;
	}

	/**
	 * @param array<int, string> $providers
	 * @return array<int, string>
	 */
	public function declare_provider( array $providers ): array {
		$providers[] = 'wpml';
		return $providers;
	}
}
