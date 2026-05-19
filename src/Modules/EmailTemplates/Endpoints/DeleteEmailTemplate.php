<?php

namespace FlowForms\Modules\EmailTemplates\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\EmailTemplates\Services\EmailTemplateRepository;
use WP_REST_Request;
use WP_REST_Response;

class DeleteEmailTemplate extends AbstractEndpoint {

	public function __construct( private readonly EmailTemplateRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id = (int) $request->get_param( 'id' );

		if ( ! $this->repo->delete( $id ) ) {
			return $this->error( __( 'Failed to delete email template.', 'flowforms' ), 500 );
		}

		return $this->success( [ 'id' => $id ] );
	}
}
