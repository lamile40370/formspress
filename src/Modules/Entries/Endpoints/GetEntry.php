<?php

namespace FlowForms\Modules\Entries\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Entries\Services\EntryRepository;
use WP_REST_Request;
use WP_REST_Response;

class GetEntry extends AbstractEndpoint {

	public function __construct( private readonly EntryRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$entry = $this->repo->get( (int) $request->get_param( 'id' ) );

		if ( ! $entry ) {
			return $this->error( __( 'Entry not found.', 'flowforms' ), 404 );
		}

		if ( 'unread' === $entry['status'] ) {
			$this->repo->update_status( (int) $entry['id'], 'read' );
			$entry['status'] = 'read';
		}

		return $this->success( $entry );
	}
}
