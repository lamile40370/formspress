<?php

namespace FlowForms\Modules\Integrations;

use FlowForms\Core\AbstractRoutes;

class Routes extends AbstractRoutes {

	public function register(): void {
		register_rest_route(
			'flowforms/v1',
			'/integrations',
			[
				'methods'             => 'GET',
				'permission_callback' => fn() => current_user_can( 'manage_options' ),
				'callback'            => [ $this, 'list_integrations' ],
			]
		);
	}

	/**
	 * Returns the catalog of integrations FormsPress knows about, plus
	 * whether each one is currently active (its PHP class exists and its
	 * settings option indicates wiring).
	 */
	public function list_integrations(): \WP_REST_Response {
		$catalog = [
			[
				'id'          => 'mailchimp',
				'label'       => 'Mailchimp',
				'category'    => 'email-marketing',
				'description' => __( 'Add submitters to a Mailchimp audience as an action.', 'flowforms' ),
				'docs'        => 'https://mailchimp.com/developer/marketing/api/lists/',
				'icon'        => 'mailchimp',
				'class'       => 'FlowForms\\Modules\\Actions\\Services\\Actions\\Integrations\\MailchimpAction',
			],
			[
				'id'          => 'convertkit',
				'label'       => 'ConvertKit',
				'category'    => 'email-marketing',
				'description' => __( 'Subscribe form submitters to a ConvertKit form / sequence.', 'flowforms' ),
				'docs'        => 'https://developers.convertkit.com/',
				'icon'        => 'convertkit',
				'class'       => 'FlowForms\\Modules\\Actions\\Services\\Actions\\Integrations\\ConvertKitAction',
			],
			[
				'id'          => 'activecampaign',
				'label'       => 'ActiveCampaign',
				'category'    => 'crm',
				'description' => __( 'Push contacts to ActiveCampaign with custom field mapping.', 'flowforms' ),
				'docs'        => 'https://developers.activecampaign.com/',
				'icon'        => 'activecampaign',
				'class'       => 'FlowForms\\Modules\\Actions\\Services\\Actions\\Integrations\\ActiveCampaignAction',
			],
			[
				'id'          => 'hubspot',
				'label'       => 'HubSpot',
				'category'    => 'crm',
				'description' => __( 'Create or update HubSpot contacts from form submissions.', 'flowforms' ),
				'docs'        => 'https://developers.hubspot.com/',
				'icon'        => 'hubspot',
				'class'       => 'FlowForms\\Modules\\Actions\\Services\\Actions\\Integrations\\HubSpotAction',
			],
			[
				'id'          => 'brevo',
				'label'       => 'Brevo (Sendinblue)',
				'category'    => 'email-marketing',
				'description' => __( 'Add submitters to a Brevo list and trigger transactional emails.', 'flowforms' ),
				'docs'        => 'https://developers.brevo.com/',
				'icon'        => 'brevo',
				'class'       => 'FlowForms\\Modules\\Actions\\Services\\Actions\\Integrations\\BrevoAction',
			],
			[
				'id'          => 'mailerpress',
				'label'       => 'MailerPress',
				'category'    => 'email-marketing',
				'description' => __( 'Add or update local MailerPress contacts from form submissions.', 'flowforms' ),
				'docs'        => 'https://mailerpress.com/docs/',
				'icon'        => 'mailerpress',
				'class'       => 'FlowForms\\Modules\\Actions\\Services\\Actions\\Integrations\\MailerPressAction',
			],
			[
				'id'          => 'stripe',
				'label'       => 'Stripe',
				'category'    => 'payment',
				'description' => __( 'Accept one-off or recurring payments via Stripe Checkout.', 'flowforms' ),
				'docs'        => 'https://stripe.com/docs/payments/checkout',
				'icon'        => 'stripe',
				'class'       => 'FlowForms\\Modules\\Stripe\\StripeModule',
				'settings'    => '/integrations/stripe',
			],
			[
				'id'          => 'webhooks',
				'label'       => __( 'Webhooks', 'flowforms' ),
				'category'    => 'developer',
				'description' => __( 'Send events to Zapier, Make, n8n or any HTTP endpoint with HMAC signing.', 'flowforms' ),
				'docs'        => 'https://flowforms.test/docs/webhooks',
				'icon'        => 'webhook',
				'class'       => 'FlowForms\\Modules\\Webhooks\\WebhooksModule',
				'settings'    => '/integrations/webhooks',
			],
		];

		// Add live "active" flag — true if the PHP class is loaded (built-ins
		// or addons), false otherwise.
		foreach ( $catalog as &$row ) {
			$row['active'] = class_exists( $row['class'] );
			if ( empty( $row['icon_svg'] ) ) {
				$row['icon_svg'] = $this->get_integration_icon_svg( $row );
			}
		}
		unset( $row );

		/**
		 * Filter: allow add-on plugins to register additional integrations
		 * for the FormsPress hub.
		 *
		 * @param array $catalog
		 */
		$catalog = apply_filters( 'flowforms_integrations_catalog', $catalog );

		foreach ( $catalog as &$row ) {
			if ( ! empty( $row['icon_svg'] ) ) {
				$row['icon_svg'] = $this->sanitize_icon_svg( (string) $row['icon_svg'] );
			}
		}
		unset( $row );

		return new \WP_REST_Response( [ 'data' => $catalog ], 200 );
	}

	private function get_integration_icon_svg( array $integration ): string {
		$class = (string) ( $integration['class'] ?? '' );
		if ( '' === $class || ! class_exists( $class ) ) {
			return '';
		}

		try {
			$reflection = new \ReflectionClass( $class );
			$constructor = $reflection->getConstructor();

			if ( ! $reflection->isInstantiable() || ( $constructor && $constructor->getNumberOfRequiredParameters() > 0 ) ) {
				return '';
			}

			$instance = $reflection->newInstance();
			if ( ! method_exists( $instance, 'get_icon' ) ) {
				return '';
			}

			$icon = trim( (string) $instance->get_icon() );
			$svg_position = stripos( $icon, '<svg' );

			if ( false === $svg_position ) {
				return '';
			}

			$icon = substr( $icon, $svg_position );

			return $this->sanitize_icon_svg( $icon );
		} catch ( \Throwable ) {
			return '';
		}
	}

	private function sanitize_icon_svg( string $svg ): string {
		return wp_kses(
			$svg,
			[
				'svg'      => [
					'class'       => true,
					'id'          => true,
					'xmlns'       => true,
					'xmlns:xlink' => true,
					'xml:space'   => true,
					'viewBox'     => true,
					'viewbox'     => true,
					'version'     => true,
					'width'       => true,
					'height'      => true,
					'fill'        => true,
					'stroke'      => true,
					'style'       => true,
					'role'        => true,
					'aria-label'  => true,
					'aria-hidden' => true,
					'focusable'   => true,
				],
				'g'        => [
					'class'     => true,
					'id'        => true,
					'fill'      => true,
					'stroke'    => true,
					'transform' => true,
					'opacity'   => true,
					'style'     => true,
				],
				'path'     => [
					'class'           => true,
					'id'              => true,
					'd'               => true,
					'fill'            => true,
					'stroke'          => true,
					'stroke-width'    => true,
					'stroke-linecap'  => true,
					'stroke-linejoin' => true,
					'opacity'         => true,
					'style'           => true,
				],
				'rect'     => [
					'class'  => true,
					'id'     => true,
					'x'      => true,
					'y'      => true,
					'width'  => true,
					'height' => true,
					'rx'     => true,
					'fill'   => true,
				],
				'circle'   => [
					'class' => true,
					'id'    => true,
					'cx'   => true,
					'cy'   => true,
					'r'    => true,
					'fill' => true,
				],
				'ellipse'  => [
					'class' => true,
					'id'    => true,
					'cx'    => true,
					'cy'    => true,
					'rx'    => true,
					'ry'    => true,
					'fill'  => true,
				],
				'line'     => [
					'class'          => true,
					'id'             => true,
					'x1'             => true,
					'y1'             => true,
					'x2'             => true,
					'y2'             => true,
					'stroke'         => true,
					'stroke-width'   => true,
					'stroke-linecap' => true,
				],
				'polygon'  => [
					'class'  => true,
					'id'     => true,
					'points' => true,
					'fill'   => true,
				],
				'polyline' => [
					'class'          => true,
					'id'             => true,
					'points'          => true,
					'fill'            => true,
					'stroke'          => true,
					'stroke-width'    => true,
					'stroke-linecap'  => true,
					'stroke-linejoin' => true,
				],
			]
		);
	}
}
