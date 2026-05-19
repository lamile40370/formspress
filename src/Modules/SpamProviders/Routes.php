<?php

namespace FlowForms\Modules\SpamProviders;

use FlowForms\Core\AbstractRoutes;
use WP_REST_Server;

class Routes extends AbstractRoutes {

	public function register(): void {
		$this->route( '/spam-providers',    WP_REST_Server::READABLE, Endpoints\ListSpamProviders::class );
		$this->route( '/storage-providers', WP_REST_Server::READABLE, Endpoints\ListStorageProviders::class );
	}
}
