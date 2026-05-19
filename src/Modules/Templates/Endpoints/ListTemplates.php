<?php

namespace FlowForms\Modules\Templates\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Templates\Services\TemplateRegistry;
use WP_REST_Request;
use WP_REST_Response;

class ListTemplates extends AbstractEndpoint {

	public function __construct( private readonly TemplateRegistry $registry ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		return $this->success( [
			'built_in' => $this->registry->get_built_in_schema(),
			'user'     => $this->registry->get_user_schema(),
		] );
	}
}
