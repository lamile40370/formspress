<?php

namespace FlowForms\Modules\Analytics;

use FlowForms\Core\AbstractRoutes;
use WP_REST_Server;

class Routes extends AbstractRoutes {

	public function register(): void {
		/* Authenticated: per-form analytics dashboard data. */
		$this->route( '/forms/(?P<id>\d+)/analytics', WP_REST_Server::READABLE, Endpoints\GetFormAnalytics::class, [
			'range' => [ 'type' => 'integer', 'default' => 14, 'enum' => [ 7, 14, 30, 90 ] ],
		] );

		/* Public: client-side event ingestion (rate-limited). */
		$handler = $this->container->make( Endpoints\TrackEvent::class );
		register_rest_route( $this->namespace, '/analytics/track', [
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => $handler,
			'permission_callback' => '__return_true',
		] );
	}
}
