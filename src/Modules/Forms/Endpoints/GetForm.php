<?php

namespace FlowForms\Modules\Forms\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Forms\Services\FormRepository;
use WP_REST_Request;
use WP_REST_Response;

class GetForm extends AbstractEndpoint {

	public function __construct( private readonly FormRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$form = $this->repo->get( (int) $request->get_param( 'id' ) );

		if ( ! $form ) {
			return $this->error( __( 'Form not found.', 'formspress' ), 404 );
		}

		return $this->success( $form );
	}
}
