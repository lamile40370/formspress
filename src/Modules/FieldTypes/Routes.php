<?php

namespace FlowForms\Modules\FieldTypes;

use FlowForms\Core\AbstractRoutes;
use WP_REST_Server;

class Routes extends AbstractRoutes {

	public function register(): void {
		$this->route( '/field-types', WP_REST_Server::READABLE, Endpoints\ListFieldTypes::class );
		$this->route( '/validators',  WP_REST_Server::READABLE, Endpoints\ListValidators::class );
	}
}
