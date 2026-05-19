<?php

namespace FlowForms\Modules\EmailTemplates\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\EmailTemplates\Services\EmailTemplateRepository;
use WP_REST_Request;
use WP_REST_Response;

class UpdateEmailTemplate extends AbstractEndpoint {

	public function __construct( private readonly EmailTemplateRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id   = (int) $request->get_param( 'id' );
		$body = $request->get_json_params() ?: [];

		if ( ! $this->repo->get( $id ) ) {
			return $this->error( __( 'Email template not found.', 'flowforms' ), 404 );
		}

		$this->repo->update( $id, $body );

		return $this->success( $this->repo->get( $id ) );
	}
}
