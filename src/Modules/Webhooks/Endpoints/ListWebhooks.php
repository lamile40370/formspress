<?php

namespace FlowForms\Modules\Webhooks\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Webhooks\Services\WebhookSubscriptionRepository;
use WP_REST_Request;
use WP_REST_Response;

class ListWebhooks extends AbstractEndpoint {

	public function __construct( private readonly WebhookSubscriptionRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		return $this->success( $this->repo->get_all() );
	}
}
