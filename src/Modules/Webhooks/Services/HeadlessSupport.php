<?php

namespace FlowForms\Modules\Webhooks\Services;

/**
 * Headless REST API support: CORS headers + Bearer-token authentication for
 * the public `/forms/{id}/submit` endpoint.
 *
 * Configured via `flowforms_settings`:
 *   - `headless_mode`   (bool)   master switch
 *   - `cors_origins`    (string) one allowed origin per line, or `*`
 *
 * Per-form submission tokens are stored under
 * `flowforms_form_token_<id>` so they can be rotated independently of the
 * form definition.
 */
class HeadlessSupport {

	public function register(): void {
		add_action( 'rest_pre_serve_request', [ $this, 'maybe_send_cors_headers' ], 10, 3 );
		add_filter( 'rest_authentication_errors', [ $this, 'maybe_authenticate_with_token' ], 9 );
	}

	private function is_flowforms_request(): bool {
		$path = rest_get_url_prefix() . '/flowforms/v1/';
		return isset( $_SERVER['REQUEST_URI'] )
			&& str_contains( (string) $_SERVER['REQUEST_URI'], $path );
	}

	private function is_enabled(): bool {
		$settings = get_option( 'flowforms_settings', [] );
		return ! empty( $settings['headless_mode'] );
	}

	/**
	 * Returns the configured allow-list of CORS origins.
	 *
	 * @return string[]
	 */
	public function get_allowed_origins(): array {
		$settings = get_option( 'flowforms_settings', [] );
		$raw      = (string) ( $settings['cors_origins'] ?? '*' );
		$lines    = array_values( array_filter( array_map( 'trim', explode( "\n", $raw ) ) ) );

		/**
		 * Filter the CORS origin allow-list.
		 *
		 * @param string[] $origins
		 */
		return (array) apply_filters( 'flowforms_cors_origins', $lines );
	}

	public function maybe_send_cors_headers( bool $served, $result, \WP_REST_Request $request ): bool {
		if ( ! $this->is_enabled() || ! $this->is_flowforms_request() ) {
			return $served;
		}

		$origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? esc_url_raw( (string) $_SERVER['HTTP_ORIGIN'] ) : '';
		$allowed = $this->get_allowed_origins();

		$matched = '';
		if ( in_array( '*', $allowed, true ) ) {
			$matched = $origin ?: '*';
		} elseif ( $origin && in_array( $origin, $allowed, true ) ) {
			$matched = $origin;
		}

		if ( '' === $matched ) {
			return $served;
		}

		header( 'Access-Control-Allow-Origin: ' . $matched );
		header( 'Vary: Origin' );
		header( 'Access-Control-Allow-Credentials: true' );
		header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
		header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce, X-FormsPress-Token' );
		header( 'Access-Control-Max-Age: 600' );

		return $served;
	}

	/**
	 * If the request carries a `Bearer ff_pub_<token>` header (or
	 * `X-FormsPress-Token: <token>`), authenticate it as a one-shot guest
	 * submission for the matching form.
	 *
	 * We don't promote it to a logged-in user — we just signal "allowed" by
	 * leaving the auth chain alone (return `$current`). The submit endpoint
	 * itself already has `permission_callback: __return_true`, so the token
	 * is checked separately on a per-form basis.
	 */
	public function maybe_authenticate_with_token( $current ) {
		if ( ! $this->is_enabled() || ! $this->is_flowforms_request() ) {
			return $current;
		}

		$token = $this->extract_token();
		if ( '' === $token ) {
			return $current;
		}

		// Stash on the request for downstream endpoints (SubmitForm) to verify
		// against the form's stored token.
		$_REQUEST['_ff_pub_token']  = $token;
		$_SERVER['_FF_PUB_TOKEN']   = $token;

		return $current;
	}

	private function extract_token(): string {
		$auth = (string) ( $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '' );
		if ( '' !== $auth && preg_match( '/^Bearer\s+(.+)$/i', $auth, $m ) ) {
			$candidate = trim( $m[1] );
			if ( str_starts_with( $candidate, 'ff_pub_' ) ) {
				return substr( $candidate, 7 );
			}
		}

		$hdr = (string) ( $_SERVER['HTTP_X_FORMSPRESS_TOKEN'] ?? '' );
		if ( '' !== $hdr ) {
			return $hdr;
		}

		return '';
	}

	/**
	 * Verify a per-form submission token. Public so SubmitForm can call it.
	 */
	public static function token_matches( int $form_id, string $token ): bool {
		if ( '' === $token || ! $form_id ) {
			return false;
		}
		$stored = (string) get_option( 'flowforms_form_token_' . $form_id, '' );
		return $stored !== '' && hash_equals( $stored, $token );
	}

	/** Rotate (or initialise) a form's submission token. */
	public static function rotate_token( int $form_id ): string {
		$token = wp_generate_password( 32, false, false );
		update_option( 'flowforms_form_token_' . $form_id, $token, false );
		return $token;
	}
}
