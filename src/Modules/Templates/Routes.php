<?php

namespace FlowForms\Modules\Templates;

use FlowForms\Core\AbstractRoutes;
use WP_REST_Server;

class Routes extends AbstractRoutes {

	public function register(): void {
		$this->route( '/templates', WP_REST_Server::READABLE, Endpoints\ListTemplates::class );

		$this->route( '/templates', WP_REST_Server::CREATABLE, Endpoints\SaveAsTemplate::class, [
			'form_id'     => [ 'required' => true, 'type' => 'integer' ],
			'label'       => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
			'description' => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_textarea_field' ],
			'category'    => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_key' ],
			'icon'        => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_key' ],
		] );

		$this->route( '/templates/(?P<id>[a-zA-Z0-9_\-]+)/create', WP_REST_Server::CREATABLE, Endpoints\CreateFromTemplate::class, [
			'title' => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
		] );

		$this->route( '/templates/(?P<id>[a-zA-Z0-9_\-]+)', WP_REST_Server::DELETABLE, Endpoints\DeleteTemplate::class );
	}
}
