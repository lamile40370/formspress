<?php

namespace FlowForms\Modules\Tools;

use FlowForms\Core\AbstractModule;

/**
 * Tools parent — nav-only.
 *
 * Houses operational pages that don't fit under Forms / Submissions /
 * Settings.
 */
class ToolsModule extends AbstractModule {

	public function get_id(): string {
		return 'tools';
	}

	public function get_name(): string {
		return __( 'Tools', 'formspress' );
	}

	public function get_nav_items(): array {
		return [
			[
				'label'       => __( 'Tools', 'formspress' ),
				'path'        => '/tools',
				'icon'        => 'admin-tools',
				'position'    => 80,
				'description' => __( 'Imports, exports and data privacy tools.', 'formspress' ),
				'children'    => [
					[
						'label' => __( 'Email templates', 'formspress' ),
						'path'  => '/tools/email-templates',
						'icon'  => 'email-alt',
					],
					[
						'label' => __( 'Logs', 'formspress' ),
						'path'  => '/tools/logs',
						'icon'  => 'list-view',
					],
					[
						'label' => __( 'Import / Export', 'formspress' ),
						'path'  => '/tools/import-export',
						'icon'  => 'post-list',
					],
					[
						'label' => __( 'Data privacy', 'formspress' ),
						'path'  => '/tools/privacy',
						'icon'  => 'admin-generic',
					],
				],
			],
		];
	}
}
