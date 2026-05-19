<?php

namespace FlowForms\Modules\Stripe\Endpoints;

use FlowForms\Modules\Entries\Services\EntryRepository;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Stripe → FlowForms webhook receiver.
 *
 * Public, no-auth endpoint mounted at /flowforms/v1/stripe/webhook. We verify
 * the `Stripe-Signature` header against the per-entry signing secret stored
 * with the entry meta (`stripe_webhook_secret`). If the secret is missing
 * we accept the event but flag it as unverified — operators can still wire
 * it up later.
 *
 * Recognised event types:
 *   - checkout.session.completed     → stripe_status = paid
 *   - checkout.session.expired       → stripe_status = failed
 *   - payment_intent.payment_failed  → stripe_status = failed
 */
class StripeWebhook {

	public function __construct( private readonly EntryRepository $entries ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$raw_body  = (string) $request->get_body();
		$signature = (string) $request->get_header( 'stripe-signature' );

		$payload = json_decode( $raw_body, true );
		if ( ! is_array( $payload ) ) {
			return new WP_REST_Response( [ 'error' => 'invalid_payload' ], 400 );
		}

		$type    = (string) ( $payload['type'] ?? '' );
		$object  = (array) ( $payload['data']['object'] ?? [] );
		$session = (string) ( $object['id'] ?? '' );
		$entry_id = (int) ( $object['metadata']['entry_id'] ?? 0 );

		/* Resolve entry: prefer the metadata entry_id, fall back to session id. */
		$entry = $entry_id > 0 ? $this->entries->get( $entry_id ) : null;
		if ( ! $entry && '' !== $session ) {
			$entry = $this->entries->find_by_meta( 'stripe_session_id', $session );
		}

		if ( ! $entry ) {
			return new WP_REST_Response( [ 'received' => true, 'reason' => 'no_entry' ], 200 );
		}

		$entry_id = (int) $entry['id'];
		$secret   = (string) ( $entry['meta']['stripe_webhook_secret'] ?? '' );
		$verified = $this->verify_signature( $raw_body, $signature, $secret );

		if ( '' !== $secret && ! $verified ) {
			return new WP_REST_Response( [ 'error' => 'bad_signature' ], 400 );
		}

		$status = match ( $type ) {
			'checkout.session.completed'    => 'paid',
			'checkout.session.expired'      => 'failed',
			'payment_intent.payment_failed' => 'failed',
			default                         => '',
		};

		if ( '' !== $status ) {
			$this->entries->set_meta( $entry_id, 'stripe_status', $status );
			if ( ! empty( $object['payment_intent'] ) ) {
				$this->entries->set_meta( $entry_id, 'stripe_payment_intent', (string) $object['payment_intent'] );
			}
			do_action( 'flowforms_stripe_status_changed', $entry_id, $status, $payload );
		}

		return new WP_REST_Response( [ 'received' => true, 'verified' => $verified ], 200 );
	}

	/**
	 * Verifies a Stripe signature header against the raw body using
	 * HMAC-SHA256 with the per-form signing secret.
	 *
	 * Header format:  t=<unix_ts>,v1=<hex>,v0=<hex>
	 * Signed payload: <t>.<raw_body>
	 *
	 * If the secret is empty we return `false` and the caller may opt to
	 * accept the event anyway (unverified).
	 */
	private function verify_signature( string $body, string $header, string $secret ): bool {
		if ( '' === $secret || '' === $header ) {
			return false;
		}

		$timestamp = null;
		$v1        = [];

		foreach ( explode( ',', $header ) as $part ) {
			$kv = explode( '=', $part, 2 );
			if ( 2 !== count( $kv ) ) {
				continue;
			}
			if ( 't' === $kv[0] ) {
				$timestamp = (int) $kv[1];
			} elseif ( 'v1' === $kv[0] ) {
				$v1[] = $kv[1];
			}
		}

		if ( null === $timestamp || empty( $v1 ) ) {
			return false;
		}

		/* Reject events older than 5 minutes (Stripe's recommendation). */
		if ( abs( time() - $timestamp ) > 300 ) {
			return false;
		}

		$signed_payload = $timestamp . '.' . $body;
		$expected       = hash_hmac( 'sha256', $signed_payload, $secret );

		foreach ( $v1 as $sig ) {
			if ( hash_equals( $expected, $sig ) ) {
				return true;
			}
		}
		return false;
	}
}
