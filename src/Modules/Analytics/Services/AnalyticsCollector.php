<?php

namespace FlowForms\Modules\Analytics\Services;

use FlowForms\Modules\Forms\Services\FormRepository;

/**
 * Server-side event recorder. Wraps the repository and applies global +
 * per-form opt-out checks before writing.
 */
class AnalyticsCollector {

	public function __construct(
		private readonly AnalyticsRepository $repo,
		private readonly FormRepository $form_repo,
	) {}

	/**
	 * Globally disabled via flowforms settings option `disable_analytics`.
	 */
	public function is_globally_disabled(): bool {
		$settings = get_option( 'flowforms_settings', [] );
		return ! empty( $settings['disable_analytics'] );
	}

	public function is_disabled_for_form( int $form_id ): bool {
		if ( $this->is_globally_disabled() ) {
			return true;
		}

		$form = $this->form_repo->get( $form_id );
		if ( ! $form ) {
			return true;
		}

		return ! empty( $form['settings']['disable_analytics'] );
	}

	/**
	 * Server-side view event from FormRenderer. Fire-and-forget — never throws.
	 */
	public function record_view( int $form_id, ?string $variant_id, string $session_id, ?string $referrer = null, ?string $user_agent = null, ?string $ip = null ): void {
		if ( $this->is_disabled_for_form( $form_id ) ) {
			return;
		}

		try {
			$this->repo->insert( [
				'form_id'         => $form_id,
				'variant_id'      => $variant_id,
				'event'           => 'view',
				'step_index'      => null,
				'session_id'      => $session_id,
				'referrer'        => $referrer,
				'user_agent_hash' => $user_agent ? md5( $user_agent ) : null,
				'country_code'    => $this->resolve_country( $ip ),
			] );
		} catch ( \Throwable $e ) {
			/* Analytics must never break form render — swallow silently. */
		}
	}

	/**
	 * Record an event coming in from the client (TrackEvent endpoint).
	 *
	 * @param array<string,mixed> $payload
	 */
	public function record_client_event( array $payload ): bool {
		$form_id = (int) ( $payload['form_id'] ?? 0 );
		if ( ! $form_id || $this->is_disabled_for_form( $form_id ) ) {
			return false;
		}

		$event = (string) ( $payload['event'] ?? '' );
		if ( ! in_array( $event, [ 'start', 'step', 'submit', 'abandon' ], true ) ) {
			return false;
		}

		return $this->repo->insert( [
			'form_id'         => $form_id,
			'variant_id'      => isset( $payload['variant_id'] ) ? (string) $payload['variant_id'] : null,
			'event'           => $event,
			'step_index'      => $payload['step_index'] ?? null,
			'session_id'      => (string) ( $payload['session_id'] ?? '' ),
			'referrer'        => isset( $payload['referrer'] ) ? (string) $payload['referrer'] : null,
			'user_agent_hash' => isset( $payload['user_agent'] ) ? md5( (string) $payload['user_agent'] ) : null,
			'country_code'    => $this->resolve_country( $payload['ip'] ?? null ),
		] );
	}

	/**
	 * Resolve country from an IP via filter. No raw IP is ever stored.
	 *
	 * Plugins can hook `flowforms_analytics_ip_to_country` to return a 2-letter
	 * ISO code (e.g. via MaxMind GeoIP). Default returns null = no country.
	 */
	private function resolve_country( ?string $ip ): ?string {
		if ( ! $ip ) {
			return null;
		}
		$code = apply_filters( 'flowforms_analytics_ip_to_country', null, $ip );
		if ( ! is_string( $code ) || strlen( $code ) !== 2 ) {
			return null;
		}
		return strtoupper( $code );
	}
}
