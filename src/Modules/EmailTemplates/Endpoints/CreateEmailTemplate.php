<?php

namespace FlowForms\Modules\EmailTemplates\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\EmailTemplates\Services\EmailTemplateRepository;
use WP_REST_Request;
use WP_REST_Response;

class CreateEmailTemplate extends AbstractEndpoint {

	public function __construct( private readonly EmailTemplateRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$body = $request->get_json_params() ?: [];

		$id = $this->repo->create( $body );

		if ( ! $id ) {
			return $this->error( __( 'Failed to create email template.', 'flowforms' ), 500 );
		}

		return $this->success( $this->repo->get( $id ), 201 );
	}
}
