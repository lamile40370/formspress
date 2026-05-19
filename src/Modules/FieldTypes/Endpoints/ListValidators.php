<?php

namespace FlowForms\Modules\FieldTypes\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Extensibility\Validators\ValidatorRegistry;
use WP_REST_Request;
use WP_REST_Response;

class ListValidators extends AbstractEndpoint {

	public function __construct( private readonly ValidatorRegistry $registry ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		return $this->success( $this->registry->get_schema() );
	}
}
