<?php

namespace FlowForms\Extensibility\StyleVariations;

/**
 * Loads form-level style variations shipped as JSON files under
 * `styles/*.json` (similar to FSE theme style variations).
 *
 * Third-party plugins/themes can register additional variations via:
 *
 *     add_action( 'flowforms_register_style_variations', function ( $loader ) {
 *         $loader->register( 'my-brand', [
 *             'title' => 'My Brand',
 *             'form'  => [ 'border_radius' => 6, 'btn_radius' => 6 ],
 *         ] );
 *     } );
 */
class StyleVariationLoader {

	/** @var array<string, array<string, mixed>> id => variation data */
	private array $variations = [];

	private bool $booted = false;

	public function boot(): void {
		if ( $this->booted ) {
			return;
		}
		$this->booted = true;

		$this->load_from_disk();

		/* Fire registration hook so plugins can add more variations. */
		do_action( 'flowforms_register_style_variations', $this );
	}

	/**
	 * Register a single variation programmatically.
	 *
	 * @param array<string, mixed> $variation
	 */
	public function register( string $id, array $variation ): void {
		$id = sanitize_key( $id );
		if ( '' === $id ) {
			return;
		}
		$this->variations[ $id ] = $this->normalize( $id, $variation );
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function get_all(): array {
		$this->boot();
		return array_values( $this->variations );
	}

	/** @return array<string, mixed>|null */
	public function get( string $id ): ?array {
		$this->boot();
		return $this->variations[ $id ] ?? null;
	}

	private function load_from_disk(): void {
		$dir = defined( 'FLOWFORMS_DIR' ) ? FLOWFORMS_DIR . 'styles/' : '';
		if ( '' === $dir || ! is_dir( $dir ) ) {
			return;
		}

		$files = glob( $dir . '*.json' ) ?: [];

		foreach ( $files as $file ) {
			$slug = sanitize_key( pathinfo( $file, PATHINFO_FILENAME ) );
			if ( '' === $slug ) {
				continue;
			}
			$raw = file_get_contents( $file );
			if ( false === $raw ) {
				continue;
			}
			$data = json_decode( $raw, true );
			if ( ! is_array( $data ) ) {
				continue;
			}
			$this->variations[ $slug ] = $this->normalize( $slug, $data );
		}
	}

	/**
	 * @param array<string, mixed> $variation
	 * @return array<string, mixed>
	 */
	private function normalize( string $id, array $variation ): array {
		return [
			'id'          => $id,
			'title'       => isset( $variation['title'] ) ? sanitize_text_field( (string) $variation['title'] ) : $id,
			'description' => isset( $variation['description'] ) ? sanitize_text_field( (string) $variation['description'] ) : '',
			'form'        => is_array( $variation['form'] ?? null ) ? $variation['form'] : [],
		];
	}
}
