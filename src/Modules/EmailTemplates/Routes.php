<?php

namespace FlowForms\Modules\EmailTemplates;

use FlowForms\Core\AbstractRoutes;
use WP_REST_Server;

class Routes extends AbstractRoutes {

	public function register(): void {
		$this->route( '/email-templates', WP_REST_Server::READABLE, Endpoints\ListEmailTemplates::class );

		$this->route( '/email-templates', WP_REST_Server::CREATABLE, Endpoints\CreateEmailTemplate::class, [
			'name'    => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
			'subject' => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
			'body'    => [ 'type' => 'string' ],
		] );

		$this->route( '/email-templates/(?P<id>\d+)', WP_REST_Server::READABLE, Endpoints\GetEmailTemplate::class );

		$this->route( '/email-templates/(?P<id>\d+)', WP_REST_Server::EDITABLE, Endpoints\UpdateEmailTemplate::class );

		$this->route( '/email-templates/(?P<id>\d+)', WP_REST_Server::DELETABLE, Endpoints\DeleteEmailTemplate::class );
	}
}
