<?php

namespace FlowForms\Modules\EmailTemplates\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\EmailTemplates\Services\EmailTemplateRepository;
use WP_REST_Request;
use WP_REST_Response;

class ListEmailTemplates extends AbstractEndpoint {

	public function __construct( private readonly EmailTemplateRepository $repo ) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		return $this->success( $this->repo->get_all() );
	}
}
