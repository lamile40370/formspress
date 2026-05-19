<?php

namespace FlowForms\Modules\Compat\Services;

/**
 * Polylang compatibility provider.
 *
 * Polylang exposes string translation via `pll_register_string` / `pll__`.
 * Domain is rendered as a "group" label inside Polylang's String Translation
 * tab. We map our `$name` into the description so each registered string is
 * uniquely identifiable for translators.
 */
class PolylangCompat {

	public function register(): void {
		if ( ! $this->is_active() ) {
			return;
		}

		add_action( 'flowforms_register_string', [ $this, 'register_string' ], 10, 3 );
		add_filter( 'flowforms_translate_string', [ $this, 'translate_string' ], 10, 4 );
		add_filter( 'flowforms_active_compat_providers', [ $this, 'declare_provider' ] );
	}

	public function is_active(): bool {
		return function_exists( 'pll_register_string' ) && function_exists( 'pll__' );
	}

	public function register_string( string $value, string $domain, string $name ): void {
		// Polylang signature: pll_register_string( $name, $string, $group = 'polylang', $multiline = false )
		pll_register_string( $name, $value, $domain, false );
	}

	/**
	 * @param string|null $translated
	 */
	public function translate_string( $translated, string $value, string $domain, string $name ): ?string {
		if ( null !== $translated ) {
			return $translated;
		}

		// pll__ returns the translation for the current language (or original).
		$out = pll__( $value );

		return is_string( $out ) ? $out : $value;
	}

	/**
	 * @param array<int, string> $providers
	 * @return array<int, string>
	 */
	public function declare_provider( array $providers ): array {
		$providers[] = 'polylang';
		return $providers;
	}
}
