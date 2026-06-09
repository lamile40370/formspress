<?php

namespace FlowForms\Modules\Entries;

use FlowForms\Core\AbstractRoutes;
use WP_REST_Server;

class Routes extends AbstractRoutes {

	public function register(): void {
		$this->route( '/entries', WP_REST_Server::READABLE, Endpoints\ListEntries::class, [
			'page'     => [ 'type' => 'integer', 'default' => 1 ],
			'per_page' => [ 'type' => 'integer', 'default' => 20 ],
			'form_id'  => [ 'type' => 'string', 'default' => '0', 'sanitize_callback' => 'sanitize_text_field' ],
			'status'   => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
			'search'   => [ 'type' => 'string', 'default' => '' ],
			'sort'     => [ 'type' => 'string', 'enum' => [ 'id', 'form_title', 'created_at', 'status' ], 'default' => 'created_at' ],
			'order'    => [ 'type' => 'string', 'enum' => [ 'ASC', 'DESC', 'asc', 'desc' ], 'default' => 'DESC' ],
		] );

		$this->route( '/forms/(?P<form_id>\d+)/entries', WP_REST_Server::READABLE, Endpoints\ListEntries::class, [
			'page'     => [ 'type' => 'integer', 'default' => 1 ],
			'per_page' => [ 'type' => 'integer', 'default' => 20 ],
			'status'   => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
			'search'   => [ 'type' => 'string', 'default' => '' ],
			'sort'     => [ 'type' => 'string', 'enum' => [ 'id', 'form_title', 'created_at', 'status' ], 'default' => 'created_at' ],
			'order'    => [ 'type' => 'string', 'enum' => [ 'ASC', 'DESC', 'asc', 'desc' ], 'default' => 'DESC' ],
		] );

		$this->route( '/entries/(?P<id>\d+)', WP_REST_Server::READABLE, Endpoints\GetEntry::class );

		$this->route( '/entries/(?P<id>\d+)/status', WP_REST_Server::EDITABLE, Endpoints\UpdateEntryStatus::class, [
			'status' => [ 'required' => true, 'type' => 'string', 'enum' => [ 'unread', 'read', 'starred', 'spam', 'trash' ] ],
		] );

		$this->route( '/entries/(?P<id>\d+)', WP_REST_Server::DELETABLE, Endpoints\DeleteEntry::class );

		$this->route( '/forms/(?P<form_id>\d+)/entries/export', WP_REST_Server::READABLE, Endpoints\ExportEntries::class );

		// Public endpoint — no authentication required.
		$handler = $this->container->make( Endpoints\SubmitForm::class );
		register_rest_route( $this->namespace, '/forms/(?P<form_id>\d+)/submit', [
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => $handler,
			'permission_callback' => '__return_true',
		] );
	}
}
