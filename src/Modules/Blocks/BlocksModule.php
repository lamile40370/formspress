<?php

namespace FlowForms\Modules\Blocks;

use FlowForms\Core\AbstractModule;

class BlocksModule extends AbstractModule {

	public function get_id(): string {
		return 'blocks';
	}

	public function get_name(): string {
		return __( 'Blocks', 'formspress' );
	}

	public function boot(): void {
		add_action( 'init', [ $this, 'register_frontend_assets' ], 5 );
		add_action( 'init', [ $this, 'register_blocks' ] );
		add_action( 'init', [ $this, 'register_patterns' ] );
		add_action( 'init', [ $this, 'register_shortcode' ] );
		add_action( 'init', [ $this, 'register_rewrite' ] );
		add_filter( 'render_block_core/columns', [ $this, 'render_columns_gap' ], 10, 2 );
		add_filter( 'query_vars', [ $this, 'add_query_vars' ] );
		add_action( 'template_redirect', [ $this, 'maybe_render_direct_link' ] );
	}

	/**
	 * Core columns are stored as static block HTML. When a form template is
	 * created server-side, the block comment can contain spacing.blockGap
	 * while the inner HTML is still a plain `.wp-block-columns` wrapper.
	 * Apply that saved attribute at render time so column spacing works.
	 */
	public function render_columns_gap( string $block_content, array $block ): string {
		$block_gap = $block['attrs']['style']['spacing']['blockGap'] ?? null;

		if ( empty( $block_gap ) ) {
			return $block_content;
		}

		$row_gap    = '';
		$column_gap = '';

		if ( is_string( $block_gap ) ) {
			$row_gap    = $this->safe_css_length( $block_gap );
			$column_gap = $row_gap;
		} elseif ( is_array( $block_gap ) ) {
			$row_gap    = $this->safe_css_length( $block_gap['top'] ?? ( $block_gap['left'] ?? '' ) );
			$column_gap = $this->safe_css_length( $block_gap['left'] ?? ( $block_gap['top'] ?? '' ) );
		}

		if ( '' === $row_gap && '' === $column_gap ) {
			return $block_content;
		}

		$gap_style = trim(
			( $row_gap || $column_gap ? 'gap:' . ( $row_gap ?: $column_gap ) . ' ' . ( $column_gap ?: $row_gap ) . ';' : '' )
			. ( $column_gap ? 'column-gap:' . $column_gap . ';' : '' )
			. ( $row_gap ? 'row-gap:' . $row_gap . ';' : '' )
		);

		return preg_replace_callback(
			'/<div\\s+([^>]*class="[^"]*\\bwp-block-columns\\b[^"]*"[^>]*)>/',
			static function ( array $matches ) use ( $gap_style ): string {
				$attrs = $matches[1];

				if ( preg_match( '/\\sstyle="([^"]*)"/', $attrs, $style_matches ) ) {
					$style = rtrim( $style_matches[1], ';' ) . ';' . $gap_style;
					$attrs = preg_replace( '/\\sstyle="([^"]*)"/', ' style="' . esc_attr( $style ) . '"', $attrs, 1 );

					return '<div ' . $attrs . '>';
				}

				return '<div ' . $attrs . ' style="' . esc_attr( $gap_style ) . '">';
			},
			$block_content,
			1
		) ?? $block_content;
	}

	private function safe_css_length( mixed $value ): string {
		$value = is_scalar( $value ) ? trim( (string) $value ) : '';

		if ( '' === $value ) {
			return '';
		}

		if ( preg_match( '/^-?\\d+(\\.\\d+)?(px|em|rem|%|vh|vw)?$/', $value ) ) {
			return preg_match( '/[a-z%]+$/', $value ) ? $value : $value . 'px';
		}

		if ( preg_match( '/^var:preset\\|spacing\\|([a-zA-Z0-9_-]+)$/', $value, $matches ) ) {
			return 'var(--wp--preset--spacing--' . $matches[1] . ')';
		}

		if ( preg_match( '/^var\\(--[a-zA-Z0-9_-]+\\)$/', $value ) ) {
			return $value;
		}

		return '';
	}

	/**
	 * Register shared frontend style/script handles BEFORE blocks register,
	 * so block.json's `style: formspress-frontend` resolves to a real handle.
	 */
	public function register_frontend_assets(): void {
		FormRenderer::register_frontend_assets();
	}

	public function register_blocks(): void {
		/* Native Gutenberg block registration from block.json metadata.
		 * WP auto-wires editor script, view script module, style handle,
		 * supports, attributes, and the PHP render callback (render.php). */
		register_block_type( FLOWFORMS_DIR . 'blocks/form' );
		register_block_type( FLOWFORMS_DIR . 'blocks/flow-form' );

		/* Standard form builder field blocks. These ARE registered
		 * client-side (JS) for the editor, but their server-render
		 * callbacks live here — so when the saved markup is piped
		 * through `do_blocks()` at front-end render time, each
		 * `formspress/field-*` block emits real input HTML instead
		 * of disappearing as an unknown block. */
		StandardFieldsRenderer::register();
	}

	public function register_patterns(): void {
		PatternRegistry::register();
	}

	public function register_shortcode(): void {
		add_shortcode( 'formspress', [ FormRenderer::class, 'render_shortcode' ] );
	}

	public function register_rewrite(): void {
		$rule = 'formspress/([0-9]+)/?$';

		add_rewrite_rule( $rule, 'index.php?formspress_id=$matches[1]', 'top' );

		$rules = get_option( 'rewrite_rules' );

		if ( ! is_array( $rules ) || ! isset( $rules[ $rule ] ) ) {
			flush_rewrite_rules( false );
			update_option( 'formspress_rewrite_flushed', true );
		}
	}

	/** @param string[] $vars */
	public function add_query_vars( array $vars ): array {
		$vars[] = 'formspress_id';
		return $vars;
	}

	public function maybe_render_direct_link(): void {
		$form_id = absint( get_query_var( 'formspress_id' ) );
		if ( ! $form_id ) {
			return;
		}

		FormRenderer::render_fullscreen( $form_id );
	}
}
