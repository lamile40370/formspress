<?php

namespace FlowForms\Modules\SpamProviders\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Extensibility\Storage\StorageRegistry;
use WP_REST_Request;
use WP_REST_Response;

class ListStorageProviders extends AbstractEndpoint {

	public function __construct( private readonly StorageRegistry $registry ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		return $this->success( $this->registry->get_schema() );
	}
}
