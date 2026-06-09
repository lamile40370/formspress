<?php

namespace FlowForms\Modules\Forms\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Forms\Services\FormRepository;
use WP_REST_Request;
use WP_REST_Response;

class CreateForm extends AbstractEndpoint {

	public function __construct( private readonly FormRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$type = $request->get_param( 'type' ) ?? 'standard';

		if ( 'flow' === $type && ! apply_filters( 'flowforms_can_use_flow_forms', false ) ) {
			return $this->error( __( 'Flow forms are available in FormsPress Pro.', 'formspress' ), 403 );
		}

		$id = $this->repo->create( [
			'title'       => $request->get_param( 'title' ),
			'description' => $request->get_param( 'description' ) ?? '',
			'type'        => $type,
			'status'      => $request->get_param( 'status' ) ?? 'active',
		] );

		if ( ! $id ) {
			return $this->error( __( 'Failed to create form.', 'formspress' ), 500 );
		}

		return $this->success( $this->repo->get( $id ), 201 );
	}
}
