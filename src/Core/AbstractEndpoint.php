<?php

namespace FlowForms\Core;

use WP_Error;
use WP_REST_Response;

abstract class AbstractEndpoint {

	abstract public function __invoke( \WP_REST_Request $request );

	public function check_permission(): bool|WP_Error {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to access this endpoint.', 'flowforms' ),
				[ 'status' => 403 ]
			);
		}

		return true;
	}

	protected function success( mixed $data = null, int $status = 200 ): WP_REST_Response {
		return new WP_REST_Response( [ 'success' => true, 'data' => $data ], $status );
	}

	protected function error( string $message, int $status = 400 ): WP_REST_Response {
		return new WP_REST_Response( [ 'success' => false, 'message' => $message ], $status );
	}

	protected function paginated( array $items, int $total, int $page, int $per_page ): WP_REST_Response {
		$response = new WP_REST_Response( [ 'success' => true, 'data' => $items, 'total' => $total ], 200 );
		$response->header( 'X-WP-Total', $total );
		$response->header( 'X-WP-TotalPages', (int) ceil( $total / $per_page ) );

		return $response;
	}
}
