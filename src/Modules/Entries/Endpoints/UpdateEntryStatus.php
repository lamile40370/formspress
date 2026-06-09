<?php

namespace FlowForms\Modules\Entries\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Entries\Services\EntryRepository;
use WP_REST_Request;
use WP_REST_Response;

class UpdateEntryStatus extends AbstractEndpoint {

	public function __construct( private readonly EntryRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id     = (int) $request->get_param( 'id' );
		$status = $request->get_param( 'status' );

		if ( ! $this->repo->get( $id ) ) {
			return $this->error( __( 'Entry not found.', 'formspress' ), 404 );
		}

		$updated = $this->repo->update_status( $id, $status );

		if ( ! $updated ) {
			return $this->error( __( 'Failed to update entry status.', 'formspress' ), 500 );
		}

		return $this->success( [ 'id' => $id, 'status' => $status ] );
	}
}
