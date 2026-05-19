<?php
/**
 * Server-side render for formspress/flow-form block.
 *
 * Flow forms keep the imperative legacy `forms.js` runtime — the iframe
 * preview in the builder depends on it. Only the standard form was
 * migrated to the Interactivity API in this iteration.
 */

use FlowForms\Modules\Blocks\FormRenderer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

echo FormRenderer::render_flow_form_block( $attributes, $content, $block ); // phpcs:ignore WordPress.Security.EscapeOutput
