<?php

namespace FlowForms\Modules\Entries\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Entries\Services\EntryDraftRepository;
use WP_REST_Request;
use WP_REST_Response;

class GetDraft extends AbstractEndpoint {

	public function __construct( private readonly EntryDraftRepository $drafts ) {}

	public function check_permission(): bool {
		return true;
	}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$form_id = (int) $request->get_param( 'form_id' );
		$token   = sanitize_text_field( (string) $request->get_param( 'token' ) );

		if ( '' === $token ) {
			return new WP_REST_Response( [ 'success' => false, 'message' => __( 'Missing token.', 'flowforms' ) ], 400 );
		}

		$draft = $this->drafts->get_by_token( $token );

		if ( ! $draft || (int) $draft['form_id'] !== $form_id ) {
			return new WP_REST_Response( [ 'success' => false, 'message' => __( 'Draft not found or expired.', 'flowforms' ) ], 404 );
		}

		return new WP_REST_Response( [
			'success'      => true,
			'token'        => $draft['token'],
			'data'         => $draft['data'] ?? [],
			'current_step' => (int) ( $draft['current_step'] ?? 0 ),
			'email'        => $draft['email'] ?? '',
			'expires_at'   => $draft['expires_at'] ?? null,
		], 200 );
	}
}
