<?php

namespace FlowForms\Modules\Webhooks\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Webhooks\Services\WebhookSubscriptionRepository;
use WP_REST_Request;
use WP_REST_Response;

class DeleteWebhook extends AbstractEndpoint {

	public function __construct( private readonly WebhookSubscriptionRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id = (int) $request->get_param( 'id' );

		if ( ! $this->repo->delete( $id ) ) {
			return $this->error( __( 'Failed to delete webhook.', 'flowforms' ), 500 );
		}

		return $this->success( [ 'id' => $id ] );
	}
}
