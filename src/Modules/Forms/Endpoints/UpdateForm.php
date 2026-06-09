<?php

namespace FlowForms\Modules\Forms\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Forms\Services\FieldsParser;
use FlowForms\Modules\Forms\Services\FormRepository;
use WP_REST_Request;
use WP_REST_Response;

class UpdateForm extends AbstractEndpoint {

	public function __construct( private readonly FormRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id = (int) $request->get_param( 'id' );

		if ( ! $this->repo->get( $id ) ) {
			return $this->error( __( 'Form not found.', 'formspress' ), 404 );
		}

		$body = $request->get_json_params() ?: [];
		if ( 'flow' === ( $body['type'] ?? '' ) && ! apply_filters( 'flowforms_can_use_flow_forms', false ) ) {
			return $this->error( __( 'Flow forms are available in FormsPress Pro.', 'formspress' ), 403 );
		}

		if (
			! empty( $body['fields_markup'] )
			&& isset( $body['fields'] )
			&& is_string( $body['fields'] )
			&& ! FieldsParser::markup_has_submit( $body['fields'] )
		) {
			return $this->error( __( 'Add a Submit button block before saving this form.', 'formspress' ), 400 );
		}

		$updated = $this->repo->update( $id, $body );

		if ( ! $updated ) {
			return $this->error( __( 'Failed to update form.', 'formspress' ), 500 );
		}

		return $this->success( $this->repo->get( $id ) );
	}
}
