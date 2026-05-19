<?php

namespace FlowForms\Modules\Entries\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Entries\Services\EntryRepository;
use WP_REST_Request;
use WP_REST_Response;

class DeleteEntry extends AbstractEndpoint {

	public function __construct( private readonly EntryRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id = (int) $request->get_param( 'id' );

		if ( ! $this->repo->get( $id ) ) {
			return $this->error( __( 'Entry not found.', 'flowforms' ), 404 );
		}

		$deleted = $this->repo->delete( $id );

		if ( ! $deleted ) {
			return $this->error( __( 'Failed to delete entry.', 'flowforms' ), 500 );
		}

		return $this->success( null, 204 );
	}
}
