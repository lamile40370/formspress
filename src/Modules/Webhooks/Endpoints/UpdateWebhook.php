<?php

namespace FlowForms\Modules\Webhooks\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Webhooks\Services\WebhookDispatcher;
use FlowForms\Modules\Webhooks\Services\WebhookSubscriptionRepository;
use WP_REST_Request;
use WP_REST_Response;

class UpdateWebhook extends AbstractEndpoint {

	public function __construct( private readonly WebhookSubscriptionRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id   = (int) $request->get_param( 'id' );
		$body = $request->get_json_params() ?: [];

		if ( ! $this->repo->get( $id ) ) {
			return $this->error( __( 'Webhook not found.', 'flowforms' ), 404 );
		}

		if ( isset( $body['events'] ) ) {
			$body['events'] = array_values( array_intersect( (array) $body['events'], WebhookDispatcher::EVENTS ) );
		}

		$this->repo->update( $id, $body );

		return $this->success( $this->repo->get( $id ) );
	}
}
