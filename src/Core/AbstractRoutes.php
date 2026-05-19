<?php

namespace FlowForms\Core;

use FlowForms\Container;

abstract class AbstractRoutes {

	protected string $namespace = 'flowforms/v1';

	public function __construct(
		protected readonly Container $container,
	) {}

	abstract public function register(): void;

	protected function route( string $route, string $method, string $endpoint, array $args = [] ): void {
		$handler = $this->container->make( $endpoint );

		register_rest_route(
			$this->namespace,
			$route,
			[
				'methods'             => $method,
				'callback'            => $handler,
				'permission_callback' => [ $handler, 'check_permission' ],
				'args'                => $args,
			]
		);
	}
}
