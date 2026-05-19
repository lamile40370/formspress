<?php

namespace FlowForms\Modules\Forms\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Forms\Services\FormRepository;
use WP_REST_Request;
use WP_REST_Response;

class ListForms extends AbstractEndpoint {

	public function __construct( private readonly FormRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$result = $this->repo->get_all( [
			'page'     => $request->get_param( 'page' ),
			'per_page' => $request->get_param( 'per_page' ),
			'search'   => $request->get_param( 'search' ) ?? '',
			'status'   => $request->get_param( 'status' ) ?? '',
			'type'     => $request->get_param( 'type' ) ?? '',
			'sort'     => $request->get_param( 'sort' ) ?? 'created_at',
			'order'    => $request->get_param( 'order' ) ?? 'DESC',
		] );

		return $this->paginated( $result['items'], $result['total'], $result['page'], $result['per_page'] );
	}
}
