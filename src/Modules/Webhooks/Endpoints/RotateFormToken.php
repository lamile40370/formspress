<?php

namespace FlowForms\Modules\Webhooks\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Forms\Services\FormRepository;
use FlowForms\Modules\Webhooks\Services\HeadlessSupport;
use WP_REST_Request;
use WP_REST_Response;

class RotateFormToken extends AbstractEndpoint {

	public function __construct( private readonly FormRepository $forms ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$form_id = (int) $request->get_param( 'id' );
		if ( ! $this->forms->get( $form_id ) ) {
			return $this->error( __( 'Form not found.', 'flowforms' ), 404 );
		}

		$token = HeadlessSupport::rotate_token( $form_id );

		return $this->success( [
			'form_id' => $form_id,
			'token'   => 'ff_pub_' . $token,
		] );
	}
}
