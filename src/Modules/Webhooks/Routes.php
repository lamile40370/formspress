<?php

namespace FlowForms\Modules\Webhooks;

use FlowForms\Core\AbstractRoutes;
use WP_REST_Server;

class Routes extends AbstractRoutes {

	public function register(): void {
		$this->route( '/webhooks',                       WP_REST_Server::READABLE,  Endpoints\ListWebhooks::class );
		$this->route( '/webhooks',                       WP_REST_Server::CREATABLE, Endpoints\CreateWebhook::class );
		$this->route( '/webhooks/(?P<id>\d+)',           WP_REST_Server::EDITABLE,  Endpoints\UpdateWebhook::class );
		$this->route( '/webhooks/(?P<id>\d+)',           WP_REST_Server::DELETABLE, Endpoints\DeleteWebhook::class );
		$this->route( '/webhooks/(?P<id>\d+)/test',      WP_REST_Server::CREATABLE, Endpoints\TestWebhook::class );
		$this->route( '/webhooks/events',                WP_REST_Server::READABLE,  Endpoints\ListWebhookEvents::class );

		// Headless: rotate a form's public submission token.
		$this->route( '/forms/(?P<id>\d+)/token/rotate', WP_REST_Server::CREATABLE, Endpoints\RotateFormToken::class );
	}
}
