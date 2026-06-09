<?php

namespace FlowForms\Modules\Integrations;

use FlowForms\Core\AbstractModule;

/**
 * Integrations hub — nav-only module.
 */
class IntegrationsModule extends AbstractModule {

	public function get_id(): string {
		return 'integrations';
	}

	public function get_name(): string {
		return __( 'Integrations', 'formspress' );
	}

	public function get_routes(): ?string {
		return Routes::class;
	}

	public function get_nav_items(): array {
		return [
			[
				'label'       => __( 'Integrations', 'formspress' ),
				'path'        => '/integrations',
				'icon'        => 'admin-plugins',
				'position'    => 50,
				'description' => __( 'Connect FormsPress to external services with add-ons.', 'formspress' ),
				'children'    => [
					[
						'label' => __( 'All integrations', 'formspress' ),
						'path'  => '/integrations',
						'icon'  => 'admin-plugins',
					],
					[
						'label' => __( 'Webhooks', 'formspress' ),
						'path'  => '/integrations/webhooks',
						'icon'  => 'rest-api',
					],
					[
						'label' => __( 'Stripe', 'formspress' ),
						'path'  => '/integrations/stripe',
						'icon'  => 'admin-plugins',
					],
				],
			],
		];
	}
}
