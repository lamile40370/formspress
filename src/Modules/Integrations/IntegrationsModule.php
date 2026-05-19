<?php

namespace FlowForms\Modules\Integrations;

use FlowForms\Core\AbstractModule;

/**
 * Integrations hub — nav-only module.
 *
 * Aggregates the disparate integrations (Mailchimp, ConvertKit, etc.,
 * Stripe, Webhooks) under one parent in the admin sidebar so users have
 * a single, predictable entry point. Actual configuration lives in the
 * respective per-integration modules.
 */
class IntegrationsModule extends AbstractModule {

	public function get_id(): string {
		return 'integrations';
	}

	public function get_name(): string {
		return __( 'Integrations', 'flowforms' );
	}

	public function get_routes(): ?string {
		return Routes::class;
	}

	public function get_nav_items(): array {
		return [
			[
				'label'       => __( 'Integrations', 'flowforms' ),
				'path'        => '/integrations',
				'icon'        => 'admin-plugins',
				'position'    => 50,
				'description' => __( 'Connect FormsPress to email marketing, CRM and payment services.', 'flowforms' ),
				'children'    => [
					[
						'label' => __( 'All integrations', 'flowforms' ),
						'path'  => '/integrations',
						'icon'  => 'admin-plugins',
					],
					[
						'label' => __( 'Webhooks', 'flowforms' ),
						'path'  => '/integrations/webhooks',
						'icon'  => 'rest-api',
					],
					[
						'label' => __( 'Stripe', 'flowforms' ),
						'path'  => '/integrations/stripe',
						'icon'  => 'admin-plugins',
					],
				],
			],
		];
	}
}
