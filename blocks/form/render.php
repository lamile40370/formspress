<?php
/**
 * Server-side render for formspress/form block.
 *
 * Variables available (provided by block_type render):
 * - $attributes : array
 * - $content    : string
 * - $block      : WP_Block
 *
 * Emits Interactivity API directives so the frontend runtime uses
 * `@wordpress/interactivity` instead of the legacy imperative handler.
 */

use FlowForms\Modules\Blocks\FormRenderer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

echo FormRenderer::render_form_block( $attributes, $content, $block ); // phpcs:ignore WordPress.Security.EscapeOutput
