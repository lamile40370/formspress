<?php

namespace FlowForms\Modules\Dashboard;

use FlowForms\Core\AbstractModule;

class DashboardModule extends AbstractModule {

	public function get_id(): string {
		return 'dashboard';
	}

	public function get_name(): string {
		return __( 'Dashboard', 'formspress' );
	}

	public function get_routes(): ?string {
		return Routes::class;
	}

	public function get_nav_items(): array {
		return [
			[
				'label'       => __( 'Dashboard', 'formspress' ),
				'path'        => '/',
				'icon'        => 'dashboard',
				'position'    => 10,
				'description' => __( 'Overview of your forms and submissions.', 'formspress' ),
			],
		];
	}
}
