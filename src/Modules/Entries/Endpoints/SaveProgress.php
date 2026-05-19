<?php

namespace FlowForms\Modules\Entries\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Entries\Services\EntryDraftRepository;
use FlowForms\Modules\Forms\Services\FormRepository;
use WP_REST_Request;
use WP_REST_Response;

class SaveProgress extends AbstractEndpoint {

	public function __construct(
		private readonly EntryDraftRepository $drafts,
		private readonly FormRepository $forms,
	) {}

	public function check_permission(): bool {
		return true;
	}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$form_id = (int) $request->get_param( 'form_id' );
		$body    = $request->get_json_params() ?: [];

		$form = $this->forms->get( $form_id );
		if ( ! $form || 'active' !== $form['status'] ) {
			return new WP_REST_Response( [ 'success' => false, 'message' => __( 'Form not found.', 'flowforms' ) ], 404 );
		}

		$settings = $form['settings'] ?? [];
		if ( empty( $settings['enable_save_resume'] ) ) {
			return new WP_REST_Response( [ 'success' => false, 'message' => __( 'Save and resume is disabled for this form.', 'flowforms' ) ], 403 );
		}

		$email = sanitize_email( $body['email'] ?? '' );
		if ( '' === $email || ! is_email( $email ) ) {
			return new WP_REST_Response( [ 'success' => false, 'message' => __( 'A valid email is required to save progress.', 'flowforms' ) ], 422 );
		}

		$data         = is_array( $body['data'] ?? null ) ? $body['data'] : [];
		$current_step = (int) ( $body['current_step'] ?? 0 );
		$token        = isset( $body['token'] ) ? sanitize_text_field( $body['token'] ) : '';
		$source_url   = esc_url_raw( $body['_source_url'] ?? get_permalink() );

		// Sanitize values recursively (string values only).
		$data = $this->sanitize_data( $data );

		if ( '' !== $token ) {
			$draft = $this->drafts->update( $token, $data, $current_step, $email );
			if ( ! $draft ) {
				$draft = $this->drafts->create( $form_id, $email, $data, $current_step );
			}
		} else {
			$draft = $this->drafts->create( $form_id, $email, $data, $current_step );
		}

		if ( ! $draft ) {
			return new WP_REST_Response( [ 'success' => false, 'message' => __( 'Could not save your progress.', 'flowforms' ) ], 500 );
		}

		$magic_link = $this->build_magic_link( $source_url, $draft['token'] );

		$this->send_email( $email, $magic_link, $settings, $form );

		return new WP_REST_Response( [
			'success'    => true,
			'token'      => $draft['token'],
			'magic_link' => $magic_link,
			'expires_at' => $draft['expires_at'] ?? null,
		], 200 );
	}

	private function sanitize_data( array $data ): array {
		$clean = [];
		foreach ( $data as $key => $value ) {
			$k = sanitize_text_field( (string) $key );
			if ( is_array( $value ) ) {
				$clean[ $k ] = array_map( 'sanitize_text_field', array_map( 'strval', $value ) );
			} else {
				$clean[ $k ] = sanitize_textarea_field( (string) $value );
			}
		}
		return $clean;
	}

	private function build_magic_link( string $source_url, string $token ): string {
		if ( '' === $source_url ) {
			$source_url = home_url( '/' );
		}
		return add_query_arg( 'formspress_resume', $token, $source_url );
	}

	private function send_email( string $to, string $magic_link, array $settings, array $form ): void {
		$default_subject = sprintf(
			/* translators: %s: form title */
			__( 'Resume your %s submission', 'flowforms' ),
			$form['title'] ?? __( 'form', 'flowforms' )
		);
		$default_body = __( "Hi,\n\nClick the link below to resume your submission:\n\n{magic_link}\n\nThis link will expire in 30 days.", 'flowforms' );

		$subject = $settings['save_resume_email_subject'] ?? $default_subject;
		$body    = $settings['save_resume_email_body']    ?? $default_body;

		$body = str_replace( '{magic_link}', $magic_link, $body );

		wp_mail( $to, $subject, $body );
	}
}
