<?php

namespace FlowForms\Modules\Dashboard;

use FlowForms\Core\AbstractRoutes;
use WP_REST_Server;

class Routes extends AbstractRoutes {

	public function register(): void {
		$this->route( '/dashboard/stats', WP_REST_Server::READABLE, Endpoints\GetStats::class );
	}
}
