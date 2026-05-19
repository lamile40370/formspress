<?php

namespace FlowForms\Modules\Templates\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Forms\Services\FormRepository;
use FlowForms\Modules\Templates\Services\TemplateRegistry;
use WP_REST_Request;
use WP_REST_Response;

class SaveAsTemplate extends AbstractEndpoint {

	public function __construct(
		private readonly TemplateRegistry $registry,
		private readonly FormRepository $repo,
	) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$form_id = (int) $request->get_param( 'form_id' );
		$form    = $this->repo->get( $form_id );

		if ( ! $form ) {
			return $this->error( __( 'Source form not found.', 'flowforms' ), 404 );
		}

		$label = sanitize_text_field( (string) $request->get_param( 'label' ) );

		if ( '' === $label ) {
			return $this->error( __( 'Template label is required.', 'flowforms' ), 400 );
		}

		$record = $this->registry->save_user_template( [
			'label'       => $label,
			'description' => sanitize_textarea_field( (string) ( $request->get_param( 'description' ) ?? '' ) ),
			'category'    => sanitize_key( (string) ( $request->get_param( 'category' ) ?? 'other' ) ),
			'icon'        => sanitize_key( (string) ( $request->get_param( 'icon' ) ?? 'cog' ) ),
			'type'        => $form['type'] ?? 'standard',
			'fields'      => $form['fields'] ?? [],
			'settings'    => $form['settings'] ?? [],
			'actions'     => $form['actions'] ?? [],
		], $form_id );

		return $this->success( $record, 201 );
	}
}
