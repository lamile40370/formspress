<?php

namespace FlowForms\Modules\Forms\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Forms\Services\FormRepository;
use WP_REST_Request;
use WP_REST_Response;

class CreateForm extends AbstractEndpoint {

	public function __construct( private readonly FormRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id = $this->repo->create( [
			'title'       => $request->get_param( 'title' ),
			'description' => $request->get_param( 'description' ) ?? '',
			'type'        => $request->get_param( 'type' ) ?? 'standard',
			'status'      => $request->get_param( 'status' ) ?? 'active',
		] );

		if ( ! $id ) {
			return $this->error( __( 'Failed to create form.', 'flowforms' ), 500 );
		}

		return $this->success( $this->repo->get( $id ), 201 );
	}
}
