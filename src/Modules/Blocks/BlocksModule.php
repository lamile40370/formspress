<?php

namespace FlowForms\Modules\Blocks;

use FlowForms\Core\AbstractModule;

class BlocksModule extends AbstractModule {

	public function get_id(): string {
		return 'blocks';
	}

	public function get_name(): string {
		return __( 'Blocks', 'flowforms' );
	}

	public function boot(): void {
		add_action( 'init', [ $this, 'register_frontend_assets' ], 5 );
		add_action( 'init', [ $this, 'register_blocks' ] );
		add_action( 'init', [ $this, 'register_patterns' ] );
		add_action( 'init', [ $this, 'register_shortcode' ] );
		add_action( 'init', [ $this, 'register_rewrite' ] );
		add_filter( 'query_vars', [ $this, 'add_query_vars' ] );
		add_action( 'template_redirect', [ $this, 'maybe_render_direct_link' ] );
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
		add_rewrite_rule( 'formspress/([0-9]+)/?$', 'index.php?formspress_id=$matches[1]', 'top' );

		/* One-time flush when the rule is registered / updated */
		if ( ! get_option( 'formspress_rewrite_flushed' ) ) {
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
