<?php

namespace FlowForms\Modules\Forms\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Forms\Services\FormRepository;
use WP_REST_Request;
use WP_REST_Response;

class DuplicateForm extends AbstractEndpoint {

	public function __construct( private readonly FormRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id = (int) $request->get_param( 'id' );

		$new_id = $this->repo->duplicate( $id );

		if ( ! $new_id ) {
			return $this->error( __( 'Failed to duplicate form.', 'flowforms' ), 500 );
		}

		return $this->success( $this->repo->get( $new_id ), 201 );
	}
}
