<?php

namespace FlowForms\Modules\Templates\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Templates\Services\TemplateRegistry;
use WP_REST_Request;
use WP_REST_Response;

class DeleteTemplate extends AbstractEndpoint {

	public function __construct( private readonly TemplateRegistry $registry ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id = (string) $request->get_param( 'id' );

		if ( ! str_starts_with( $id, 'user_' ) ) {
			return $this->error( __( 'Built-in templates cannot be deleted.', 'formspress' ), 403 );
		}

		$deleted = $this->registry->delete_user_template( $id );

		if ( ! $deleted ) {
			return $this->error( __( 'Template not found.', 'formspress' ), 404 );
		}

		return $this->success( [ 'deleted' => true ] );
	}
}
