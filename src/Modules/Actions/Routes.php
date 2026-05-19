<?php

namespace FlowForms\Modules\Actions;

use FlowForms\Core\AbstractRoutes;
use WP_REST_Server;

class Routes extends AbstractRoutes {

	public function register(): void {
		$this->route( '/actions', WP_REST_Server::READABLE, Endpoints\ListActions::class );
	}
}
