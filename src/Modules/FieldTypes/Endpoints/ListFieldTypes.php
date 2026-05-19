<?php

namespace FlowForms\Modules\FieldTypes\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Extensibility\FieldTypes\FieldTypeRegistry;
use WP_REST_Request;
use WP_REST_Response;

class ListFieldTypes extends AbstractEndpoint {

	public function __construct( private readonly FieldTypeRegistry $registry ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		return $this->success( $this->registry->get_schema() );
	}
}
