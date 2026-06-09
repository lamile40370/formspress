<?php

namespace FlowForms\Modules\Forms\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Forms\Services\FormRepository;
use WP_REST_Request;
use WP_REST_Response;

class DeleteForm extends AbstractEndpoint {

	public function __construct( private readonly FormRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id = (int) $request->get_param( 'id' );

		if ( ! $this->repo->get( $id ) ) {
			return $this->error( __( 'Form not found.', 'formspress' ), 404 );
		}

		$deleted = $this->repo->delete( $id );

		if ( ! $deleted ) {
			return $this->error( __( 'Failed to delete form.', 'formspress' ), 500 );
		}

		return $this->success( null, 204 );
	}
}
