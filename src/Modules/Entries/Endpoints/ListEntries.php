<?php

namespace FlowForms\Modules\Entries\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Entries\Services\EntryRepository;
use WP_REST_Request;
use WP_REST_Response;

class ListEntries extends AbstractEndpoint {

	public function __construct( private readonly EntryRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$form_id = (int) ( $request->get_param( 'form_id' ) ?? 0 );

		$result = $this->repo->get_all( $form_id, [
			'page'     => $request->get_param( 'page' ),
			'per_page' => $request->get_param( 'per_page' ),
			'status'   => $request->get_param( 'status' ) ?? '',
			'search'   => $request->get_param( 'search' ) ?? '',
			'sort'     => $request->get_param( 'sort' ) ?? 'created_at',
			'order'    => $request->get_param( 'order' ) ?? 'DESC',
		] );

		return $this->paginated( $result['items'], $result['total'], $result['page'], $result['per_page'] );
	}
}
