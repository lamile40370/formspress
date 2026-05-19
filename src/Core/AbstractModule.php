<?php

namespace FlowForms\Core;

use FlowForms\Container;

abstract class AbstractModule {

	abstract public function get_id(): string;

	abstract public function get_name(): string;

	public function register_services( Container $container ): void {}

	/**
	 * @return string[]
	 */
	public function get_subscribers(): array {
		return [];
	}

	public function get_routes(): ?string {
		return null;
	}

	public function get_migrations_path(): ?string {
		return null;
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function get_nav_items(): array {
		return [];
	}

	public function boot(): void {}
}
