<?php

namespace FlowForms\Core;

use FlowForms\Container;
use FlowForms\Extensibility\FieldTypes\FieldTypeRegistry;
use FlowForms\Extensibility\SpamProviders\SpamProviderRegistry;
use FlowForms\Extensibility\Storage\StorageRegistry;
use FlowForms\Extensibility\StyleVariations\StyleVariationLoader;
use FlowForms\Extensibility\Validators\ValidatorRegistry;
use FlowForms\Hooks\Attributes\Action;

class Assets {

	public function __construct(
		private readonly ModuleRegistry $registry,
		private readonly Container $container,
	) {}

	#[Action( 'admin_enqueue_scripts' )]
	public function enqueue_admin_assets( string $hook_suffix ): void {
		if ( 'toplevel_page_flowforms' !== $hook_suffix ) {
			return;
		}

		// Required for MediaUpload (welcome screen image picker, etc.)
		wp_enqueue_media();

		// Required so `wp.editor.initialize()` (TinyMCE) is available
		// in the admin — the EmailDesigner uses it as a real WYSIWYG
		// for the action "Send email" body.
		if ( function_exists( 'wp_enqueue_editor' ) ) {
			wp_enqueue_editor();
		}

		/* Surface theme.json's block style variations to the editor by
		 * shipping the global STYLES tree via `flowFormsData` (see the
		 * `themeGlobalStylesJson` localised key below). The companion
		 * `__experimentalStyles` setting in `buildEditorSettings` reads
		 * from it, exposing the "Default / Display / Subtitle /
		 * Annotation" picker on Paragraph and the equivalents on
		 * Heading / Button / Image.
		 *
		 * We deliberately do NOT call `do_action(
		 * 'enqueue_block_editor_assets' )` here: it assumes the current
		 * screen is `post.php` / `site-editor.php` and would let
		 * third-party listeners enqueue scripts that interfere with
		 * our bundle (silently dequeuing `wp-block-library`,
		 * registering categories that hide our inserter, etc.). The
		 * passive data-export approach above is sufficient. */

		$asset_file = FLOWFORMS_DIR . 'assets/build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;
		$script_file = FLOWFORMS_DIR . 'assets/build/index.js';
		$style_file  = FLOWFORMS_DIR . 'assets/build/index.css';
		$asset_version = file_exists( $script_file )
			? (string) md5_file( $script_file )
			: ( $asset['version'] ?? FLOWFORMS_VERSION );

		wp_enqueue_script(
			'flowforms-admin',
			FLOWFORMS_URL . 'assets/build/index.js',
			$asset['dependencies'],
			$asset_version,
			true
		);

		if ( file_exists( $style_file ) ) {
			wp_enqueue_style(
				'flowforms-admin',
				FLOWFORMS_URL . 'assets/build/index.css',
				[
					// The form builder mounts `<InterfaceSkeleton>` from
					// `@wordpress/interface` together with the full block
					// editor. We pull in the exact same CSS bundle WP loads
					// on the post-edit screen so the layout, header,
					// complementary areas, panels, inserter, breadcrumb,
					// FullscreenMode behaviour and `.editor-styles-wrapper`
					// canvas all render natively.
					'wp-components',
					'wp-block-editor',
					'wp-edit-post',
					'wp-edit-blocks',
					'wp-format-library',
					'wp-block-library',
				],
				(string) md5_file( $style_file )
			);
		}

		wp_set_script_translations( 'flowforms-admin', 'flowforms', FLOWFORMS_DIR . 'languages' );

		wp_localize_script(
			'flowforms-admin',
			'flowFormsData',
			[
				'apiNamespace'      => 'flowforms/v1',
				'nonce'             => wp_create_nonce( 'wp_rest' ),
				'adminUrl'          => admin_url(),
				'siteUrl'           => get_site_url(),
				'pluginUrl'         => FLOWFORMS_URL,
				'version'           => FLOWFORMS_VERSION,
				'navItems'          => $this->registry->get_all_nav_items(),
				'settings'          => get_option( 'flowforms_settings', [] ),
				'themeVariations'   => self::get_theme_variations(),
				'themeFontSizes'    => self::get_theme_font_sizes(),
				'themeFontFamilies' => self::get_theme_font_families(),
				'themePalette'      => self::get_theme_palette(),
				// Full theme.json output for the block editor — same data
				// the post editor receives. `themeGlobalStyles` is the CSS
				// string that powers `<EditorStyles>`; `themeGlobalSettings`
				// is the resolved settings object that drives the inspector
				// controls (palette, fontSizes, layout, spacing, etc.).
				'themeGlobalStyles'   => self::get_theme_global_stylesheet(),
				'themeGlobalSettings' => function_exists( 'wp_get_global_settings' )
					? wp_get_global_settings()
					: (object) [],
				/* Theme.json STYLES tree — separate from settings. Carries
				 * `styles.blocks.<name>.variations` which is what powers
				 * the Block Inspector's "Styles" picker for paragraphs,
				 * headings, buttons, etc. Passed to the editor as
				 * `__experimentalStyles` in `buildEditorSettings`. */
				'themeGlobalStylesJson' => function_exists( 'wp_get_global_styles' )
					? wp_get_global_styles()
					: (object) [],
				/* Server-side block-style registry — every style
				 * registered via `register_block_style()` (themes /
				 * plugins) PLUS theme.json `styles.blocks.*.variations`
				 * that WP processes into the registry on init.
				 *
				 * Shape: `{ blockName: { variationName: { name, label, … } } }`.
				 *
				 * The JS-side `registerFormFieldBlocks()` iterates over
				 * this and re-registers each style via
				 * `wp.blocks.registerBlockStyle()` so the Block Inspector
				 * surfaces the same "Styles" picker the native post
				 * editor does — without our admin page having to pretend
				 * it's a real block-editor screen (which would let
				 * third-party listeners interfere with our bundle). */
				'blockStyleVariations' => class_exists( '\WP_Block_Styles_Registry' )
					? \WP_Block_Styles_Registry::get_instance()->get_all_registered()
					: (object) [],
				/* CSS for block style variations that themes register via
				 * `register_block_style()`'s `inline_style` property. These
				 * are NOT included in `wp_get_global_stylesheet()` — they
				 * live in the registry as raw strings and are normally
				 * enqueued at frontend render time. We concatenate them
				 * here so the editor canvas (which uses `<EditorStyles>`)
				 * can apply the visual variation when the user picks one
				 * from the inspector "Styles" picker. */
				'blockStyleVariationsCss' => self::get_block_style_variations_css(),
				'fieldTypes'        => $this->get_field_types_schema(),
				'validators'        => $this->get_validators_schema(),
				'spamProviders'     => $this->get_spam_providers_schema(),
				'storageProviders'  => $this->get_storage_providers_schema(),
				// Plugin-shipped variations (legacy `styles/*.json` in this
				// plugin) — kept for back-compat with existing customer setups.
				'styleVariations'   => $this->get_style_variations(),
				// REAL FSE theme variations, pulled from the active theme's
				// `theme.json` + `styles/*.json`. This is what the form builder
				// surfaces in the "Theme" tab.
				'fseThemeVariations' => self::get_fse_theme_variations(),
				'bindingTargets'    => $this->get_binding_targets(),
				'user'              => [
					'name'   => wp_get_current_user()->display_name,
					'avatar' => get_avatar_url( get_current_user_id(), [ 'size' => 64 ] ),
				],
			]
		);
	}

	/**
	 * Concatenate every `inline_style` registered for block style
	 * variations via `register_block_style()`. Themes use this to ship
	 * the CSS for their "Display / Subtitle / Annotation / …" picker
	 * options. The CSS is NOT in `wp_get_global_stylesheet()`, so we
	 * have to dig it out of the registry ourselves and feed it into
	 * the editor canvas via `<EditorStyles>`.
	 *
	 * Style handles (`style_handle`) are skipped — they refer to
	 * registered stylesheets that need their own enqueue dance, which
	 * we don't attempt here. Most themes use `inline_style` directly,
	 * so this covers ~all real-world cases.
	 */
	private static function get_block_style_variations_css(): string {
		if ( ! class_exists( '\WP_Block_Styles_Registry' ) ) {
			return '';
		}
		$all = \WP_Block_Styles_Registry::get_instance()->get_all_registered();
		$css = '';
		foreach ( $all as $block_name => $variations ) {
			if ( ! is_array( $variations ) ) {
				continue;
			}
			foreach ( $variations as $style ) {
				if ( is_array( $style ) && ! empty( $style['inline_style'] ) && is_string( $style['inline_style'] ) ) {
					$css .= "\n" . self::importantize_css_declarations( $style['inline_style'] );
				}
				if ( is_array( $style ) && ! empty( $style['style_data'] ) && is_array( $style['style_data'] ) && ! empty( $style['name'] ) ) {
					$css .= self::compile_block_style_variation_css(
						(string) $block_name,
						(string) $style['name'],
						$style['style_data']
					);
				}
			}
		}
		return $css . self::get_theme_block_style_variations_css();
	}

	/**
	 * Return the active theme stylesheet used by the embedded block editor.
	 *
	 * `wp_get_global_stylesheet()` deliberately omits block style variation
	 * rules. That is fine on the front end, where core can generate those
	 * rules during block rendering, but this custom admin editor needs the
	 * complete stylesheet up front so selecting Paragraph → Annotation /
	 * Display / Subtitle immediately affects the canvas.
	 */
	private static function get_theme_global_stylesheet(): string {
		if ( ! class_exists( '\WP_Theme_JSON_Resolver' ) ) {
			return function_exists( 'wp_get_global_stylesheet' )
				? wp_get_global_stylesheet( [ 'variables', 'styles', 'presets' ] )
				: '';
		}

		try {
			$tree = \WP_Theme_JSON_Resolver::get_merged_data();
			if ( method_exists( '\WP_Theme_JSON_Resolver', 'resolve_theme_file_uris' ) ) {
				$tree = \WP_Theme_JSON_Resolver::resolve_theme_file_uris( $tree );
			}

			return (string) $tree->get_stylesheet(
				[ 'variables', 'styles', 'presets' ],
				[ 'default', 'theme', 'custom' ],
				[ 'include_block_style_variations' => true ]
			);
		} catch ( \Throwable ) {
			return function_exists( 'wp_get_global_stylesheet' )
				? wp_get_global_stylesheet( [ 'variables', 'styles', 'presets' ] )
				: '';
		}
	}

	/**
	 * Build editor CSS for block-style variation partials declared by the
	 * active theme under `styles/blocks/*.json`.
	 *
	 * Core applies those styles lazily during `render_block()` by creating
	 * per-block instance classes. Our custom admin canvas never runs that
	 * render pass, so we emit generic `.wp-block-*.is-style-*` rules here.
	 */
	private static function get_theme_block_style_variations_css(): string {
		if ( ! class_exists( '\WP_Theme_JSON_Resolver' ) || ! class_exists( '\WP_Theme_JSON' ) ) {
			return '';
		}

		try {
			$variations = \WP_Theme_JSON_Resolver::get_style_variations( 'block' );
		} catch ( \Throwable ) {
			return '';
		}

		if ( empty( $variations ) || ! is_array( $variations ) ) {
			return '';
		}

		$css = '';
		foreach ( $variations as $variation ) {
			if ( empty( $variation['styles'] ) || empty( $variation['blockTypes'] ) ) {
				continue;
			}

			$variation_name = (string) ( $variation['slug'] ?? _wp_to_kebab_case( (string) ( $variation['title'] ?? '' ) ) );
			if ( '' === $variation_name ) {
				continue;
			}

			foreach ( (array) $variation['blockTypes'] as $block_type ) {
				$css .= self::compile_block_style_variation_css(
					(string) $block_type,
					$variation_name,
					(array) $variation['styles']
				);
			}
		}

		return $css;
	}

	/**
	 * Compile one block-style variation into reusable canvas CSS.
	 *
	 * The extra `!important` is intentional inside this isolated editor
	 * stylesheet: several core typography controls write inline styles
	 * (`font-size: 16px`) in the custom builder, which otherwise masks
	 * variations such as Twenty Twenty-Five's "Display".
	 *
	 * @param array<string, mixed> $variation_data
	 */
	private static function compile_block_style_variation_css( string $block_type, string $variation_name, array $variation_data ): string {
		if ( '' === $block_type || '' === $variation_name ) {
			return '';
		}

		try {
			$registry = \WP_Block_Styles_Registry::get_instance();
			$was_registered = $registry->is_registered( $block_type, $variation_name );
			if ( ! $was_registered ) {
				$registry->register( $block_type, [ 'name' => $variation_name ] );
			}

			$config = [
				'version' => \WP_Theme_JSON::LATEST_SCHEMA,
				'styles'  => [
					'blocks' => [
						$block_type => [
							'variations' => [
								$variation_name => $variation_data,
							],
						],
					],
				],
			];

			$theme_json = new \WP_Theme_JSON( $config, 'custom' );
			$css = (string) $theme_json->get_stylesheet(
				[ 'styles' ],
				[ 'custom' ],
				[
					'include_block_style_variations' => true,
					'skip_root_layout_styles'        => true,
				]
			);

			if ( ! $was_registered ) {
				$registry->unregister( $block_type, $variation_name );
			}

			return self::importantize_css_declarations( $css );
		} catch ( \Throwable ) {
			return '';
		}
	}

	private static function importantize_css_declarations( string $css ): string {
		if ( '' === $css ) {
			return '';
		}

		return (string) preg_replace_callback(
			'/([a-zA-Z-]+)\s*:\s*([^;{}]+)(;?)/',
			static function ( array $matches ): string {
				$property = $matches[1];
				$value    = trim( $matches[2] );
				$suffix   = $matches[3] ?: ';';

				if ( str_starts_with( $property, '--' ) || str_contains( strtolower( $value ), '!important' ) ) {
					return $matches[0];
				}

				return $property . ': ' . $value . ' !important' . $suffix;
			},
			$css
		);
	}

	private function get_field_types_schema(): array {
		if ( ! $this->container->has( FieldTypeRegistry::class ) ) {
			return [];
		}
		/** @var FieldTypeRegistry $r */
		$r = $this->container->get( FieldTypeRegistry::class );
		return $r->get_schema();
	}

	private function get_validators_schema(): array {
		if ( ! $this->container->has( ValidatorRegistry::class ) ) {
			return [];
		}
		/** @var ValidatorRegistry $r */
		$r = $this->container->get( ValidatorRegistry::class );
		return $r->get_schema();
	}

	private function get_spam_providers_schema(): array {
		if ( ! $this->container->has( SpamProviderRegistry::class ) ) {
			return [];
		}
		/** @var SpamProviderRegistry $r */
		$r = $this->container->get( SpamProviderRegistry::class );
		return $r->get_schema();
	}

	private function get_storage_providers_schema(): array {
		if ( ! $this->container->has( StorageRegistry::class ) ) {
			return [];
		}
		/** @var StorageRegistry $r */
		$r = $this->container->get( StorageRegistry::class );
		return $r->get_schema();
	}

	/**
	 * Plugin-shipped form style variations (see `styles/*.json`).
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function get_style_variations(): array {
		if ( ! $this->container->has( StyleVariationLoader::class ) ) {
			return [];
		}
		/** @var StyleVariationLoader $loader */
		$loader = $this->container->get( StyleVariationLoader::class );
		return $loader->get_all();
	}

	/**
	 * Real FSE style variations from the active theme's `theme.json`
	 * plus its `styles/*.json` siblings. Each entry has enough metadata
	 * for the form builder to render a true visual preview (palette
	 * dots + Aa in the variation's font family) and to re-apply the
	 * variation server-side when rendering the form.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private static function get_fse_theme_variations(): array {
		if ( ! class_exists( '\\WP_Theme_JSON_Resolver' ) || ! class_exists( '\\WP_Theme_JSON' ) ) {
			return [];
		}

		try {
			$raw = \WP_Theme_JSON_Resolver::get_style_variations( 'theme' );
		} catch ( \Throwable ) {
			return [];
		}
		if ( ! is_array( $raw ) ) {
			return [];
		}

		$out = [];
		foreach ( $raw as $variation ) {
			if ( ! is_array( $variation ) ) {
				continue;
			}
			$settings = $variation['settings'] ?? [];
			$palette  = $settings['color']['palette'] ?? [];
			if ( isset( $palette['theme'] ) && is_array( $palette['theme'] ) ) {
				$palette = $palette['theme'];
			}

			$font_families = $settings['typography']['fontFamilies'] ?? [];
			if ( isset( $font_families['theme'] ) && is_array( $font_families['theme'] ) ) {
				$font_families = $font_families['theme'];
			}
			$primary_font = '';
			if ( ! empty( $font_families ) && is_array( $font_families ) ) {
				$first = reset( $font_families );
				if ( is_array( $first ) ) {
					$primary_font = (string) ( $first['fontFamily'] ?? '' );
				}
			}

			$out[] = [
				'slug'        => (string) ( $variation['slug']    ?? '' ),
				'title'       => (string) ( $variation['title']   ?? '' ),
				'description' => (string) ( $variation['description'] ?? '' ),
				'palette'     => is_array( $palette ) ? array_values( array_map(
					static fn( $c ): array => [
						'slug'  => (string) ( $c['slug']  ?? '' ),
						'name'  => (string) ( $c['name']  ?? '' ),
						'color' => (string) ( $c['color'] ?? '' ),
					],
					$palette
				) ) : [],
				'fontFamily'  => $primary_font,
				// Pre-compiled CSS for this variation — same output the
				// Site Editor produces when you pick a variation. Lets the
				// form builder swap the canvas's stylesheet live without
				// a REST round-trip.
				'css'         => self::compile_variation_css( $variation ),
			];
		}

		return $out;
	}

	/**
	 * Merge a single variation on top of the active theme's theme.json
	 * and return the resulting CSS (variables + styles + presets) — the
	 * exact stylesheet the front-end would output if that variation were
	 * the user's chosen global style.
	 */
	private static function compile_variation_css( array $variation ): string {
		try {
			// `get_merged_data` returns a cached singleton — clone before
			// mutating so we don't poison the global state with each
			// variation's overrides.
			$base = clone \WP_Theme_JSON_Resolver::get_merged_data( 'theme' );

			// `version` is required by WP_Theme_JSON's constructor; default
			// to 2 if the variation didn't declare it.
			$variation_data = array_merge( [ 'version' => 2 ], $variation );
			$overrides      = new \WP_Theme_JSON( $variation_data, 'custom' );

			$base->merge( $overrides );
			return (string) $base->get_stylesheet(
				[ 'variables', 'styles', 'presets' ],
				null,
				[ 'include_block_style_variations' => true ]
			);
		} catch ( \Throwable ) {
			return '';
		}
	}

	/**
	 * Discoverable binding targets (CPTs the user can wire form fields to).
	 *
	 * @return array<string, mixed>
	 */
	private function get_binding_targets(): array {
		$post_types = [];
		foreach ( get_post_types( [ 'public' => true ], 'objects' ) as $pt ) {
			$post_types[] = [
				'slug'     => $pt->name,
				'label'    => $pt->labels->singular_name ?? $pt->name,
				'has_meta' => post_type_supports( $pt->name, 'custom-fields' ),
			];
		}
		return [
			'post_types' => $post_types,
		];
	}

	/**
	 * Build a list of theme presets for the form builder, sourced from the
	 * active FSE theme's `theme.json` and its style variations.
	 *
	 * @return array<int, array{id:string, label:string, bg:string, text:string, primary:string, btnText:string}>
	 */
	private static function get_theme_variations(): array {
		if ( ! class_exists( '\WP_Theme_JSON_Resolver' ) ) {
			return [];
		}

		$variations = [];

		/* Default — current theme.json (active variation, refs already resolved). */
		$merged_data    = \WP_Theme_JSON_Resolver::get_merged_data();
		$merged_raw     = $merged_data->get_raw_data();
		$base_settings  = $merged_data->get_settings();
		$base_palette   = self::extract_palette( $base_settings );
		$base_fonts     = self::extract_font_families( $base_settings );
		$base_styles    = $merged_raw['styles'] ?? [];

		$variations[] = self::build_variation(
			'theme-default',
			wp_get_theme()->get( 'Name' ) ?: __( 'Default', 'flowforms' ),
			$base_palette,
			$base_fonts,
			$base_styles
		);

		/* Style variations (typically under /styles/*.json in FSE themes). */
		if ( method_exists( '\WP_Theme_JSON_Resolver', 'get_style_variations' ) ) {
			$style_variations = \WP_Theme_JSON_Resolver::get_style_variations();

			foreach ( $style_variations as $variation ) {
				$name        = $variation['title'] ?? __( 'Variation', 'flowforms' );
				$var_palette = self::extract_palette( $variation['settings'] ?? [] );
				$var_fonts   = self::extract_font_families( $variation['settings'] ?? [] );
				$var_styles  = $variation['styles'] ?? [];

				$palette = array_merge( $base_palette, $var_palette );
				$fonts   = array_merge( $base_fonts, $var_fonts );
				$styles  = self::merge_styles( $base_styles, $var_styles );

				$variations[] = self::build_variation(
					'theme-' . sanitize_title( $name ),
					$name,
					$palette,
					$fonts,
					$styles
				);
			}
		}

		return $variations;
	}

	/**
	 * Resolved theme.json font sizes from the active theme (merged settings).
	 *
	 * @return array<int, array{slug:string, size:string, name:string}>
	 */
	private static function get_theme_font_sizes(): array {
		if ( ! class_exists( '\WP_Theme_JSON_Resolver' ) ) {
			return [];
		}
		$settings = \WP_Theme_JSON_Resolver::get_merged_data()->get_settings();
		$raw      = $settings['typography']['fontSizes'] ?? [];

		if ( isset( $raw['theme'] ) || isset( $raw['default'] ) || isset( $raw['custom'] ) ) {
			$raw = array_merge(
				is_array( $raw['default'] ?? null ) ? $raw['default'] : [],
				is_array( $raw['theme']   ?? null ) ? $raw['theme']   : [],
				is_array( $raw['custom']  ?? null ) ? $raw['custom']  : []
			);
		}

		$out = [];
		foreach ( (array) $raw as $fs ) {
			if ( ! is_array( $fs ) || empty( $fs['slug'] ) || empty( $fs['size'] ) ) {
				continue;
			}
			$out[] = [
				'slug' => (string) $fs['slug'],
				'size' => (string) $fs['size'],
				'name' => (string) ( $fs['name'] ?? $fs['slug'] ),
			];
		}
		return $out;
	}

	/**
	 * Resolved theme.json font families list (active theme).
	 *
	 * @return array<int, array{slug:string, fontFamily:string, name:string}>
	 */
	private static function get_theme_font_families(): array {
		if ( ! class_exists( '\WP_Theme_JSON_Resolver' ) ) {
			return [];
		}
		$settings = \WP_Theme_JSON_Resolver::get_merged_data()->get_settings();
		$raw      = $settings['typography']['fontFamilies'] ?? [];

		if ( isset( $raw['theme'] ) || isset( $raw['default'] ) || isset( $raw['custom'] ) ) {
			$raw = array_merge(
				is_array( $raw['default'] ?? null ) ? $raw['default'] : [],
				is_array( $raw['theme']   ?? null ) ? $raw['theme']   : [],
				is_array( $raw['custom']  ?? null ) ? $raw['custom']  : []
			);
		}

		$out = [];
		foreach ( (array) $raw as $ff ) {
			if ( ! is_array( $ff ) || empty( $ff['slug'] ) || empty( $ff['fontFamily'] ) ) {
				continue;
			}
			$out[] = [
				'slug'       => (string) $ff['slug'],
				'fontFamily' => (string) $ff['fontFamily'],
				'name'       => (string) ( $ff['name'] ?? $ff['slug'] ),
			];
		}
		return $out;
	}

	/**
	 * Resolved theme.json palette list (active theme).
	 *
	 * @return array<int, array{slug:string, color:string, name:string}>
	 */
	private static function get_theme_palette(): array {
		if ( ! class_exists( '\WP_Theme_JSON_Resolver' ) ) {
			return [];
		}
		$settings = \WP_Theme_JSON_Resolver::get_merged_data()->get_settings();
		$raw      = $settings['color']['palette'] ?? [];

		if ( isset( $raw['theme'] ) || isset( $raw['default'] ) || isset( $raw['custom'] ) ) {
			$raw = array_merge(
				is_array( $raw['default'] ?? null ) ? $raw['default'] : [],
				is_array( $raw['theme']   ?? null ) ? $raw['theme']   : [],
				is_array( $raw['custom']  ?? null ) ? $raw['custom']  : []
			);
		}

		$out = [];
		foreach ( (array) $raw as $c ) {
			if ( ! is_array( $c ) || empty( $c['slug'] ) || empty( $c['color'] ) ) {
				continue;
			}
			$out[] = [
				'slug'  => (string) $c['slug'],
				'color' => (string) $c['color'],
				'name'  => (string) ( $c['name'] ?? $c['slug'] ),
			];
		}
		return $out;
	}

	/**
	 * Compose one variation entry combining colors, typography and button styles.
	 *
	 * @param array<string,string>             $palette  slug => hex
	 * @param array<string,string>             $fonts    slug => CSS font-family
	 * @param array<string,mixed>              $styles   theme.json `styles` subtree
	 * @return array<string,string>
	 */
	private static function build_variation( string $id, string $label, array $palette, array $fonts, array $styles ): array {
		$colors  = self::palette_to_colors( $palette );

		$body_font = self::resolve_ref( $styles['typography']['fontFamily'] ?? '', $palette, $fonts, 'font' );

		$btn_styles = $styles['elements']['button'] ?? [];
		$btn_bg     = self::resolve_ref( $btn_styles['color']['background'] ?? '', $palette, $fonts, 'color' );
		$btn_text   = self::resolve_ref( $btn_styles['color']['text']       ?? '', $palette, $fonts, 'color' );
		$btn_radius = $btn_styles['border']['radius'] ?? '';
		$btn_font   = self::resolve_ref( $btn_styles['typography']['fontFamily'] ?? '', $palette, $fonts, 'font' );

		return array_filter( [
			'id'         => $id,
			'label'      => $label,
			'bg'         => $colors['bg'],
			'text'       => $colors['text'],
			'primary'    => $colors['primary'],
			'btnText'    => $btn_text ?: $colors['btnText'],
			'btnBg'      => $btn_bg   ?: '',
			'btnRadius'  => $btn_radius,
			'fontFamily' => $body_font,
			'btnFont'    => $btn_font,
		], static fn ( $v ) => $v !== null && $v !== '' );
	}

	/**
	 * Shallow-merge two theme.json `styles` subtrees, with variation winning.
	 *
	 * @param array<string,mixed> $base
	 * @param array<string,mixed> $variation
	 * @return array<string,mixed>
	 */
	private static function merge_styles( array $base, array $variation ): array {
		$out = $base;
		foreach ( $variation as $key => $value ) {
			if ( is_array( $value ) && isset( $base[ $key ] ) && is_array( $base[ $key ] ) ) {
				$out[ $key ] = self::merge_styles( $base[ $key ], $value );
			} else {
				$out[ $key ] = $value;
			}
		}
		return $out;
	}

	/**
	 * Resolve a `var(--wp--preset--*--slug)` reference using the variation's own palette / fontFamilies.
	 * If the value is already a literal (`#abc`, `Inter, sans-serif`), return it as-is.
	 *
	 * @param array<string,string> $palette
	 * @param array<string,string> $fonts
	 * @param 'color'|'font'       $kind
	 */
	private static function resolve_ref( $value, array $palette, array $fonts, string $kind ): string {
		if ( ! is_string( $value ) || $value === '' ) {
			return '';
		}
		if ( preg_match( '/var\(\s*--wp--preset--color--([a-z0-9_-]+)\s*\)/i', $value, $m ) ) {
			return $palette[ $m[1] ] ?? '';
		}
		if ( preg_match( '/var\(\s*--wp--preset--font-family--([a-z0-9_-]+)\s*\)/i', $value, $m ) ) {
			return $fonts[ $m[1] ] ?? '';
		}
		/* Unresolvable var() ref — drop rather than ship a broken CSS var. */
		if ( str_starts_with( $value, 'var(' ) ) {
			return '';
		}
		return $value;
	}

	/**
	 * Extract `settings.typography.fontFamilies` as slug => fontFamily string map.
	 *
	 * @param array<string,mixed> $settings
	 * @return array<string,string>
	 */
	private static function extract_font_families( array $settings ): array {
		$raw = $settings['typography']['fontFamilies'] ?? [];

		if ( isset( $raw['theme'] ) || isset( $raw['default'] ) || isset( $raw['custom'] ) ) {
			$raw = array_merge(
				is_array( $raw['default'] ?? null ) ? $raw['default'] : [],
				is_array( $raw['theme']   ?? null ) ? $raw['theme']   : [],
				is_array( $raw['custom']  ?? null ) ? $raw['custom']  : []
			);
		}

		$fonts = [];
		foreach ( (array) $raw as $ff ) {
			if ( ! is_array( $ff ) || empty( $ff['slug'] ) || empty( $ff['fontFamily'] ) ) {
				continue;
			}
			$fonts[ $ff['slug'] ] = $ff['fontFamily'];
		}
		return $fonts;
	}

	/**
	 * Extract the color palette (slug => hex map) from a theme.json settings array.
	 *
	 * @param array<string,mixed> $settings
	 * @return array<string,string>
	 */
	private static function extract_palette( array $settings ): array {
		$raw = $settings['color']['palette'] ?? [];

		/* Merged data uses keyed origins (theme / default / custom); variations use a flat list. */
		if ( isset( $raw['theme'] ) || isset( $raw['default'] ) || isset( $raw['custom'] ) ) {
			$raw = array_merge(
				is_array( $raw['default'] ?? null ) ? $raw['default'] : [],
				is_array( $raw['theme']   ?? null ) ? $raw['theme']   : [],
				is_array( $raw['custom']  ?? null ) ? $raw['custom']  : []
			);
		}

		$palette = [];
		foreach ( (array) $raw as $color ) {
			if ( ! is_array( $color ) || empty( $color['slug'] ) || empty( $color['color'] ) ) {
				continue;
			}
			$palette[ $color['slug'] ] = $color['color'];
		}
		return $palette;
	}

	/**
	 * Map a palette to the form-builder color slots, using common theme.json
	 * slug conventions (base, contrast, primary, accent, …) with fallbacks.
	 *
	 * @param array<string,string> $palette
	 * @return array{bg:string, text:string, primary:string, btnText:string}
	 */
	private static function palette_to_colors( array $palette ): array {
		$pick = static function ( array $candidates, string $fallback ) use ( $palette ): string {
			foreach ( $candidates as $slug ) {
				if ( ! empty( $palette[ $slug ] ) ) {
					return $palette[ $slug ];
				}
			}
			return $fallback;
		};

		return [
			'bg'      => $pick( [ 'base', 'background', 'white', 'light', 'neutral' ], '#ffffff' ),
			'text'    => $pick( [ 'contrast', 'foreground', 'text', 'dark', 'black', 'heading' ], '#1d2327' ),
			'primary' => $pick( [ 'primary', 'accent', 'accent-1', 'accent-2', 'brand', 'link' ], '#2271b1' ),
			'btnText' => $pick( [ 'base', 'background', 'white', 'light' ], '#ffffff' ),
		];
	}

	#[Action( 'enqueue_block_editor_assets' )]
	public function enqueue_editor_assets(): void {
		$asset_file = FLOWFORMS_DIR . 'assets/build/editor.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'flowforms-editor',
			FLOWFORMS_URL . 'assets/build/editor.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( FLOWFORMS_DIR . 'assets/build/editor.css' ) ) {
			wp_enqueue_style(
				'flowforms-editor',
				FLOWFORMS_URL . 'assets/build/editor.css',
				[],
				$asset['version']
			);
		}

		wp_localize_script(
			'flowforms-editor',
			'flowFormsEditorData',
			[
				'apiNamespace' => 'flowforms/v1',
				'nonce'        => wp_create_nonce( 'wp_rest' ),
				'adminUrl'     => admin_url(),
				'pluginUrl'    => FLOWFORMS_URL,
			]
		);
	}
}
