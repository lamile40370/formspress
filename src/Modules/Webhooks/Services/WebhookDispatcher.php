<?php

namespace FlowForms\Modules\Webhooks\Services;

/**
 * Fires HTTP POST requests for each subscription matching a given event.
 *
 * Signs the body with HMAC-SHA256 if a `secret` is set on the subscription.
 * Failures are logged via `error_log()` but never re-thrown — webhook delivery
 * MUST NOT block form submission. A future job queue could retry; for now
 * fire-and-forget is the contract.
 */
class WebhookDispatcher {

	/** Registered event names (used by the UI to populate the multiselect). */
	public const EVENTS = [
		'entry.created',
		'entry.deleted',
		'entry.starred',
		'form.created',
		'form.updated',
		'form.deleted',
		'form.published',
		'form.unpublished',
	];

	public function __construct(
		private readonly WebhookSubscriptionRepository $repo,
	) {}

	/**
	 * Dispatch a single event to all matching subscriptions.
	 *
	 * @param string               $event   Event name (e.g. `entry.created`).
	 * @param array<string, mixed> $payload Event-specific payload.
	 */
	public function dispatch( string $event, array $payload ): void {
		$subscriptions = $this->repo->get_active_for_event( $event );
		if ( empty( $subscriptions ) ) {
			return;
		}

		$envelope = [
			'event'     => $event,
			'timestamp' => gmdate( 'c' ),
			'data'      => $payload,
		];

		foreach ( $subscriptions as $sub ) {
			$this->deliver( $sub, $envelope );
		}
	}

	/**
	 * Synchronous fire-and-forget POST. Returns the response array (or WP_Error)
	 * mostly so the `test` endpoint can surface it to the UI.
	 *
	 * @param array<string, mixed> $sub
	 * @param array<string, mixed> $envelope
	 */
	public function deliver( array $sub, array $envelope ): array|\WP_Error {
		$url = (string) ( $sub['url'] ?? '' );
		if ( '' === $url ) {
			return new \WP_Error( 'ff_webhook_missing_url', 'Subscription has no URL.' );
		}

		$body = wp_json_encode( $envelope );

		$headers = [
			'Content-Type'              => 'application/json',
			'User-Agent'                => 'FormsPress-Webhooks/' . ( defined( 'FLOWFORMS_VERSION' ) ? FLOWFORMS_VERSION : '1.0' ),
			'X-FormsPress-Event'        => (string) ( $envelope['event'] ?? '' ),
			'X-FormsPress-Delivery'     => wp_generate_uuid4(),
		];

		if ( ! empty( $sub['secret'] ) ) {
			$headers['X-FormsPress-Signature'] = 'sha256=' . hash_hmac( 'sha256', $body, (string) $sub['secret'] );
		}

		$response = wp_remote_post( $url, [
			'headers'  => $headers,
			'body'     => $body,
			'timeout'  => 8,
			'blocking' => true,
		] );

		if ( is_wp_error( $response ) ) {
			error_log( sprintf(
				'[FormsPress] Webhook delivery failed (#%d → %s): %s',
				(int) ( $sub['id'] ?? 0 ),
				$url,
				$response->get_error_message()
			) );
			return $response;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( $code >= 400 ) {
			error_log( sprintf(
				'[FormsPress] Webhook delivery non-2xx (#%d → %s): HTTP %d',
				(int) ( $sub['id'] ?? 0 ),
				$url,
				$code
			) );
		}

		return $response;
	}
}
