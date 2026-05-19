<?php

namespace FlowForms\Modules\Webhooks\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Webhooks\Services\WebhookDispatcher;
use FlowForms\Modules\Webhooks\Services\WebhookSubscriptionRepository;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Send a fake `entry.created` payload to the subscription so users can wire
 * up Zapier/Make and click "Catch Hook" → "Test trigger" without needing to
 * submit a real form.
 */
class TestWebhook extends AbstractEndpoint {

	public function __construct(
		private readonly WebhookSubscriptionRepository $repo,
		private readonly WebhookDispatcher $dispatcher,
	) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id  = (int) $request->get_param( 'id' );
		$sub = $this->repo->get( $id );

		if ( ! $sub ) {
			return $this->error( __( 'Webhook not found.', 'flowforms' ), 404 );
		}

		$envelope = [
			'event'     => 'entry.created',
			'timestamp' => gmdate( 'c' ),
			'data'      => [
				'entry' => [
					'id'         => 0,
					'form_id'    => 0,
					'status'     => 'unread',
					'created_at' => current_time( 'mysql' ),
					'fields'     => [
						'name'    => [ 'label' => 'Name',    'value' => 'Jane Doe' ],
						'email'   => [ 'label' => 'Email',   'value' => 'jane@example.com' ],
						'message' => [ 'label' => 'Message', 'value' => 'This is a FormsPress webhook test.' ],
					],
					'_test'      => true,
				],
				'form'  => [
					'id'     => 0,
					'title'  => 'Sample form',
					'type'   => 'standard',
					'status' => 'active',
				],
			],
		];

		$result = $this->dispatcher->deliver( $sub, $envelope );

		if ( is_wp_error( $result ) ) {
			return $this->error( $result->get_error_message(), 502 );
		}

		return $this->success( [
			'response_code' => (int) wp_remote_retrieve_response_code( $result ),
			'response_body' => (string) wp_remote_retrieve_body( $result ),
		] );
	}
}
