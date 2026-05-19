<?php

namespace FlowForms\Modules\Forms;

use FlowForms\Core\AbstractRoutes;
use WP_REST_Server;

class Routes extends AbstractRoutes {

	public function register(): void {
		$this->route( '/forms', WP_REST_Server::READABLE, Endpoints\ListForms::class, [
			'page'     => [ 'type' => 'integer', 'default' => 1 ],
			'per_page' => [ 'type' => 'integer', 'default' => 20 ],
			'search'   => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
			'status'   => [ 'type' => 'string', 'enum' => [ 'active', 'inactive', 'draft' ] ],
			'type'     => [ 'type' => 'string', 'enum' => [ 'standard', 'flow' ] ],
		] );

		$this->route( '/forms', WP_REST_Server::CREATABLE, Endpoints\CreateForm::class, [
			'title' => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
			'type'  => [ 'type' => 'string', 'enum' => [ 'standard', 'flow' ], 'default' => 'standard' ],
		] );

		$this->route( '/forms/(?P<id>\d+)', WP_REST_Server::READABLE, Endpoints\GetForm::class );

		$this->route( '/forms/(?P<id>\d+)', WP_REST_Server::EDITABLE, Endpoints\UpdateForm::class );

		$this->route( '/forms/(?P<id>\d+)', WP_REST_Server::DELETABLE, Endpoints\DeleteForm::class );

		$this->route( '/forms/(?P<id>\d+)/duplicate', WP_REST_Server::CREATABLE, Endpoints\DuplicateForm::class );
	}
}
