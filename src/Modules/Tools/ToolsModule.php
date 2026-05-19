<?php

namespace FlowForms\Modules\Tools;

use FlowForms\Core\AbstractModule;

/**
 * Tools parent — nav-only.
 *
 * Houses the operational pages that don't fit under Forms / Submissions /
 * Settings: email templates, delivery logs, import / export, privacy.
 */
class ToolsModule extends AbstractModule {

	public function get_id(): string {
		return 'tools';
	}

	public function get_name(): string {
		return __( 'Tools', 'flowforms' );
	}

	public function get_nav_items(): array {
		return [
			[
				'label'       => __( 'Tools', 'flowforms' ),
				'path'        => '/tools',
				'icon'        => 'admin-tools',
				'position'    => 80,
				'description' => __( 'Email templates, delivery logs, imports and data exports.', 'flowforms' ),
				'children'    => [
					[
						'label' => __( 'Email templates', 'flowforms' ),
						'path'  => '/tools/email-templates',
						'icon'  => 'email-alt',
					],
					[
						'label' => __( 'Logs', 'flowforms' ),
						'path'  => '/tools/logs',
						'icon'  => 'list-view',
					],
					[
						'label' => __( 'Import / Export', 'flowforms' ),
						'path'  => '/tools/import-export',
						'icon'  => 'post-list',
					],
					[
						'label' => __( 'Data privacy', 'flowforms' ),
						'path'  => '/tools/privacy',
						'icon'  => 'admin-generic',
					],
				],
			],
		];
	}
}
