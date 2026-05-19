<?php

namespace FlowForms\Modules\Settings\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Extensibility\StyleVariations\StyleVariationLoader;
use WP_REST_Request;
use WP_REST_Response;

/**
 * GET /flowforms/v1/style-variations
 *
 * Returns the list of plugin-shipped form-level style variations
 * (under `styles/*.json`), plus any registered via the
 * `flowforms_register_style_variations` action.
 */
class ListStyleVariations extends AbstractEndpoint {

	public function __construct(
		private readonly StyleVariationLoader $loader,
	) {}

	public function check_permission(): bool {
		return current_user_can( 'edit_posts' );
	}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		return $this->success( $this->loader->get_all() );
	}
}
