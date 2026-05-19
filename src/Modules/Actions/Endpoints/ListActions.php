<?php

namespace FlowForms\Modules\Actions\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Actions\Services\ActionRegistry;
use WP_REST_Request;
use WP_REST_Response;

class ListActions extends AbstractEndpoint {

	public function __construct( private readonly ActionRegistry $registry ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		return $this->success( $this->registry->get_schema() );
	}
}
