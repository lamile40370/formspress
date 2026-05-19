<?php

namespace FlowForms\Modules\Entries\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Extensibility\Storage\StorageRegistry;
use FlowForms\Modules\Entries\Services\EntryProcessor;
use FlowForms\Modules\Forms\Services\FormRepository;
use FlowForms\Modules\Webhooks\Services\HeadlessSupport;
use WP_REST_Request;
use WP_REST_Response;

class SubmitForm extends AbstractEndpoint {

	public function __construct(
		private readonly EntryProcessor $processor,
		private readonly StorageRegistry $storage,
		private readonly FormRepository $form_repo,
	) {}

	/**
	 * Always public — the form decides per-request whether to trust the
	 * caller via cookie+nonce OR a `ff_pub_<token>` bearer header.
	 */
	public function check_permission(): bool {
		return true;
	}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$form_id = (int) $request->get_param( 'form_id' );
		$body    = $request->get_json_params();

		/* If no JSON body, treat as multipart and read $_POST / $_FILES. */
		if ( empty( $body ) ) {
			$body = $request->get_params();
		}

		/* Headless: if the request carries a `ff_pub_<token>`, validate it
		   against the form's stored token. We allow it OR a cookie-based
		   request; anonymous + token-less submissions still work as before
		   (back-compat). */
		$token = isset( $_REQUEST['_ff_pub_token'] ) ? sanitize_text_field( (string) $_REQUEST['_ff_pub_token'] ) : '';
		if ( '' !== $token && class_exists( HeadlessSupport::class ) && ! HeadlessSupport::token_matches( $form_id, $token ) ) {
			return new WP_REST_Response( [
				'success' => false,
				'message' => __( 'Invalid public submission token.', 'flowforms' ),
			], 401 );
		}

		/* Handle file uploads through the active storage provider. */
		$files = $request->get_file_params();
		if ( ! empty( $files ) ) {
			$form = $this->form_repo->get( $form_id );
			$provider = $this->storage->get_active();
			$config   = $this->storage->get_active_config();

			foreach ( $files as $field_id => $upload ) {
				if ( ! is_array( $upload ) || empty( $upload['tmp_name'] ) || ! empty( $upload['error'] ) ) {
					continue;
				}
				try {
					$stored = $provider->store( $upload, $form ?: [], $config );
					$body[ $field_id ] = $stored['url'];
				} catch ( \Throwable $e ) {
					return new WP_REST_Response( [
						'success' => false,
						'errors'  => [ $field_id => $e->getMessage() ],
					], 422 );
				}
			}
		}

		$meta = [
			'ip_address' => $this->get_client_ip(),
			'user_agent' => sanitize_text_field( $_SERVER['HTTP_USER_AGENT'] ?? '' ),
			'user_id'    => get_current_user_id() ?: null,
			'source_url' => sanitize_text_field( $body['_source_url'] ?? '' ),
		];

		unset( $body['_source_url'] );

		$result = $this->processor->process( $form_id, $body ?: [], $meta );

		$status = $result['success'] ? 200 : 422;

		return new WP_REST_Response( $result, $status );
	}

	private function get_client_ip(): string {
		$keys = [
			'HTTP_CF_CONNECTING_IP',
			'HTTP_X_FORWARDED_FOR',
			'HTTP_X_REAL_IP',
			'REMOTE_ADDR',
		];

		foreach ( $keys as $key ) {
			if ( ! empty( $_SERVER[ $key ] ) ) {
				$ip = explode( ',', sanitize_text_field( $_SERVER[ $key ] ) )[0];
				if ( filter_var( trim( $ip ), FILTER_VALIDATE_IP ) ) {
					return trim( $ip );
				}
			}
		}

		return '';
	}
}
