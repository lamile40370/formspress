<?php

namespace FlowForms\Modules\Analytics\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Analytics\Services\AnalyticsCollector;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Public endpoint — no auth required. Rate-limited per-IP via a short-lived
 * transient (60 events / minute) to keep abuse manageable.
 */
class TrackEvent extends AbstractEndpoint {

	public function __construct(
		private readonly AnalyticsCollector $collector,
	) {}

	public function check_permission(): bool {
		return true;
	}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$payload = $request->get_json_params() ?: $request->get_params();

		$form_id    = (int) ( $payload['form_id'] ?? 0 );
		$event      = sanitize_text_field( (string) ( $payload['event'] ?? '' ) );
		$session_id = sanitize_text_field( (string) ( $payload['session_id'] ?? '' ) );
		$step_index = isset( $payload['step_index'] ) && '' !== $payload['step_index'] ? (int) $payload['step_index'] : null;
		$variant_id = isset( $payload['variant_id'] ) ? sanitize_text_field( (string) $payload['variant_id'] ) : null;
		$referrer   = isset( $payload['referrer'] ) ? esc_url_raw( (string) $payload['referrer'] ) : null;

		if ( ! $form_id || ! $event || ! $session_id ) {
			return $this->error( __( 'Invalid payload.', 'flowforms' ), 400 );
		}

		if ( ! $this->within_rate_limit() ) {
			/* Drop silently but ack — keep beacon happy. */
			return $this->success( null, 202 );
		}

		$ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
		$ip = $this->client_ip();

		$ok = $this->collector->record_client_event( [
			'form_id'    => $form_id,
			'event'      => $event,
			'step_index' => $step_index,
			'variant_id' => $variant_id,
			'session_id' => $session_id,
			'referrer'   => $referrer,
			'user_agent' => $ua,
			'ip'         => $ip,
		] );

		return $this->success( [ 'recorded' => (bool) $ok ] );
	}

	private function within_rate_limit(): bool {
		$ip      = $this->client_ip();
		$bucket  = 'ff_an_rl_' . md5( $ip ?: 'anon' );
		$count   = (int) get_transient( $bucket );
		if ( $count >= 60 ) {
			return false;
		}
		set_transient( $bucket, $count + 1, MINUTE_IN_SECONDS );
		return true;
	}

	private function client_ip(): string {
		$ip = '';
		if ( isset( $_SERVER['REMOTE_ADDR'] ) ) {
			$ip = (string) $_SERVER['REMOTE_ADDR'];
		}
		return $ip;
	}
}
