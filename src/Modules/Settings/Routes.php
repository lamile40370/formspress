<?php

namespace FlowForms\Modules\Settings;

use FlowForms\Core\AbstractRoutes;
use WP_REST_Server;

class Routes extends AbstractRoutes {

	public function register(): void {
		$this->route( '/settings', WP_REST_Server::READABLE, Endpoints\GetSettings::class );
		$this->route( '/settings', WP_REST_Server::EDITABLE, Endpoints\UpdateSettings::class );
		$this->route( '/style-variations', WP_REST_Server::READABLE, Endpoints\ListStyleVariations::class );
	}
}
