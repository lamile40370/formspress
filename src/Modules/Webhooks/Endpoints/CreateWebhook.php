<?php

namespace FlowForms\Modules\Webhooks\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Webhooks\Services\WebhookDispatcher;
use FlowForms\Modules\Webhooks\Services\WebhookSubscriptionRepository;
use WP_REST_Request;
use WP_REST_Response;

class CreateWebhook extends AbstractEndpoint {

	public function __construct( private readonly WebhookSubscriptionRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$body = $request->get_json_params() ?: [];

		// Validate events against the allow-list to avoid silent typos.
		$events = array_values( array_intersect(
			(array) ( $body['events'] ?? [] ),
			WebhookDispatcher::EVENTS
		) );
		$body['events'] = $events;

		if ( empty( $body['url'] ) || ! filter_var( $body['url'], FILTER_VALIDATE_URL ) ) {
			return $this->error( __( 'A valid URL is required.', 'flowforms' ), 422 );
		}
		if ( empty( $events ) ) {
			return $this->error( __( 'At least one event must be selected.', 'flowforms' ), 422 );
		}

		// Always have a secret — auto-generate if not supplied.
		if ( empty( $body['secret'] ) ) {
			$body['secret'] = wp_generate_password( 32, false, false );
		}

		$body['active'] = array_key_exists( 'active', $body ) ? (bool) $body['active'] : true;

		$id = $this->repo->create( $body );
		if ( ! $id ) {
			return $this->error( __( 'Failed to create webhook.', 'flowforms' ), 500 );
		}

		return $this->success( $this->repo->get( $id ), 201 );
	}
}
