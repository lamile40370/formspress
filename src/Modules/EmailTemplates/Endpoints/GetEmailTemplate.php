<?php

namespace FlowForms\Modules\EmailTemplates\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\EmailTemplates\Services\EmailTemplateRepository;
use WP_REST_Request;
use WP_REST_Response;

class GetEmailTemplate extends AbstractEndpoint {

	public function __construct( private readonly EmailTemplateRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id   = (int) $request->get_param( 'id' );
		$tpl  = $this->repo->get( $id );

		if ( ! $tpl ) {
			return $this->error( __( 'Email template not found.', 'flowforms' ), 404 );
		}

		return $this->success( $tpl );
	}
}
