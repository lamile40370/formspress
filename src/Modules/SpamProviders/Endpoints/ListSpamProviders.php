<?php

namespace FlowForms\Modules\SpamProviders\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Extensibility\SpamProviders\SpamProviderRegistry;
use WP_REST_Request;
use WP_REST_Response;

class ListSpamProviders extends AbstractEndpoint {

	public function __construct( private readonly SpamProviderRegistry $registry ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		return $this->success( $this->registry->get_schema() );
	}
}
