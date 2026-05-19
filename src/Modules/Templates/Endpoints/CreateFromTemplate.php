<?php

namespace FlowForms\Modules\Templates\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Forms\Services\FormRepository;
use FlowForms\Modules\Templates\Services\TemplateRegistry;
use WP_REST_Request;
use WP_REST_Response;

class CreateFromTemplate extends AbstractEndpoint {

	public function __construct(
		private readonly TemplateRegistry $registry,
		private readonly FormRepository $repo,
	) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$id       = (string) $request->get_param( 'id' );
		$template = $this->registry->get( $id );

		if ( ! $template ) {
			return $this->error( __( 'Template not found.', 'flowforms' ), 404 );
		}

		$override_title = $request->get_param( 'title' );
		$title          = is_string( $override_title ) && '' !== trim( $override_title )
			? sanitize_text_field( $override_title )
			: $template->label;

		$settings = array_merge( $this->repo->default_settings(), $template->settings );

		// Templates can ship either a Gutenberg-block-markup body
		// (preferred — full design with root container, headings,
		// images, styled fields, submit) or a legacy `fields` schema
		// array (wrapped in a default styled root group on first edit).
		$create_args = [
			'title'       => $title,
			'description' => $template->description,
			'type'        => $template->type,
			'status'      => 'draft',
			'settings'    => $settings,
			'actions'     => $template->actions,
		];
		if ( null !== $template->block_markup && '' !== $template->block_markup ) {
			$create_args['fields']        = $template->block_markup;
			$create_args['fields_markup'] = true;
		} else {
			$create_args['fields']        = $template->fields;
			$create_args['fields_markup'] = false;
		}

		$new_id = $this->repo->create( $create_args );

		if ( ! $new_id ) {
			return $this->error( __( 'Failed to create form from template.', 'flowforms' ), 500 );
		}

		return $this->success( $this->repo->get( $new_id ), 201 );
	}
}
