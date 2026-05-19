<?php

namespace FlowForms\Modules\Webhooks\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Webhooks\Services\WebhookDispatcher;
use WP_REST_Request;
use WP_REST_Response;

class ListWebhookEvents extends AbstractEndpoint {

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		return $this->success( array_values( WebhookDispatcher::EVENTS ) );
	}
}
