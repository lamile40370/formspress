<?php

namespace FlowForms\Modules\Actions\Services\Actions;

use FlowForms\Modules\Actions\Services\AbstractAction;
use FlowForms\Modules\Entries\Services\EntryRepository;

/**
 * Stripe Checkout Session action.
 *
 * Resolves an amount from a form field (which may itself be a calculation
 * field), builds a Stripe Checkout Session, persists the session id/url on
 * the entry, and exposes a `redirect_url` meta key so EntryProcessor can
 * tell the frontend to navigate the visitor to Stripe.
 *
 * No Stripe SDK — we call the REST API directly with `wp_remote_post`.
 */
class StripePaymentAction extends AbstractAction {

	private const STRIPE_API = 'https://api.stripe.com/v1/checkout/sessions';

	public function get_id(): string {
		return 'stripe_payment';
	}

	public function get_label(): string {
		return __( 'Stripe — Take payment', 'flowforms' );
	}

	public function get_icon(): string {
		return 'link';
	}

	public function get_description(): string {
		return __( 'Redirect the visitor to a Stripe Checkout page to collect a payment.', 'flowforms' );
	}

	public function get_fields(): array {
		return [
			[
				'key'   => 'secret_key',
				'type'  => 'password',
				'label' => __( 'Stripe secret key', 'flowforms' ),
				'help'  => __( 'sk_test_… or sk_live_… — found in your Stripe dashboard.', 'flowforms' ),
			],
			[
				'key'   => 'publishable_key',
				'type'  => 'text',
				'label' => __( 'Stripe publishable key', 'flowforms' ),
				'help'  => __( 'pk_test_… or pk_live_…', 'flowforms' ),
			],
			[
				'key'     => 'mode',
				'type'    => 'select',
				'label'   => __( 'Mode', 'flowforms' ),
				'default' => 'payment',
				'options' => [
					[ 'value' => 'payment',      'label' => __( 'One-time payment', 'flowforms' ) ],
					[ 'value' => 'subscription', 'label' => __( 'Subscription',     'flowforms' ) ],
				],
			],
			[
				'key'   => 'amount_field',
				'type'  => 'text',
				'label' => __( 'Amount field ID', 'flowforms' ),
				'help'  => __( 'ID of the form field (or calculation field) holding the amount in major units.', 'flowforms' ),
			],
			[
				'key'     => 'currency',
				'type'    => 'select',
				'label'   => __( 'Currency', 'flowforms' ),
				'default' => 'EUR',
				'options' => [
					[ 'value' => 'EUR', 'label' => 'EUR' ],
					[ 'value' => 'USD', 'label' => 'USD' ],
					[ 'value' => 'GBP', 'label' => 'GBP' ],
					[ 'value' => 'CAD', 'label' => 'CAD' ],
					[ 'value' => 'AUD', 'label' => 'AUD' ],
					[ 'value' => 'JPY', 'label' => 'JPY' ],
				],
			],
			[
				'key'         => 'description_template',
				'type'        => 'text',
				'label'       => __( 'Description', 'flowforms' ),
				'placeholder' => 'Order from {field:email}',
				'help'        => __( 'Supports {field:id} merge tags.', 'flowforms' ),
			],
			[
				'key'   => 'success_url',
				'type'  => 'url',
				'label' => __( 'Success URL', 'flowforms' ),
				'help'  => __( 'Supports {form_id} and {entry_id}. We append ?stripe_session_id=… on redirect.', 'flowforms' ),
			],
			[
				'key'   => 'cancel_url',
				'type'  => 'url',
				'label' => __( 'Cancel URL', 'flowforms' ),
			],
			[
				'key'         => 'customer_email_field',
				'type'        => 'text',
				'label'       => __( 'Customer email field', 'flowforms' ),
				'placeholder' => 'email',
				'help'        => __( 'ID of the form field that contains the buyer email.', 'flowforms' ),
			],
			[
				'key'   => 'metadata_fields',
				'type'  => 'textarea',
				'label' => __( 'Metadata', 'flowforms' ),
				'rows'  => 3,
				'help'  => __( 'One key=field_id per line. Sent to Stripe as session metadata.', 'flowforms' ),
			],
			[
				'key'   => 'webhook_signing_secret',
				'type'  => 'password',
				'label' => __( 'Webhook signing secret', 'flowforms' ),
				'help'  => __( 'Optional. Verifies events sent to /flowforms/v1/stripe/webhook (whsec_…).', 'flowforms' ),
			],
		];
	}

	public function run( array $config, array $entry, array $form ): void {
		$secret_key = (string) ( $config['secret_key'] ?? '' );
		if ( '' === $secret_key ) {
			return;
		}

		$amount_field = (string) ( $config['amount_field'] ?? '' );
		$amount       = (float) $this->get_field_value( $amount_field, $entry );
		if ( $amount <= 0 ) {
			return;
		}

		$currency  = strtolower( (string) ( $config['currency'] ?? 'EUR' ) );
		$is_zero_decimal = in_array( $currency, [ 'jpy', 'krw', 'vnd', 'clp' ], true );
		$unit_amount = $is_zero_decimal ? (int) round( $amount ) : (int) round( $amount * 100 );

		$entry_id = (int) ( $entry['id'] ?? 0 );
		$form_id  = (int) ( $form['id'] ?? 0 );

		$description = $this->resolve_variables(
			(string) ( $config['description_template'] ?? '' ),
			$entry,
			$form
		);
		if ( '' === $description ) {
			$description = sprintf( __( '%s — Entry #%d', 'flowforms' ), $form['title'] ?? 'Form', $entry_id );
		}

		$success_url = $this->resolve_variables( (string) ( $config['success_url'] ?? '' ), $entry, $form );
		$success_url = str_replace( [ '{form_id}', '{entry_id}' ], [ (string) $form_id, (string) $entry_id ], $success_url );
		$success_url = add_query_arg(
			[
				'stripe_session_id' => '{CHECKOUT_SESSION_ID}',
				'entry_id'          => $entry_id,
			],
			$success_url
		);

		$cancel_url = $this->resolve_variables( (string) ( $config['cancel_url'] ?? home_url() ), $entry, $form );

		$customer_email = '';
		if ( ! empty( $config['customer_email_field'] ) ) {
			$customer_email = $this->get_field_value( (string) $config['customer_email_field'], $entry );
		}

		$metadata = [
			'entry_id' => (string) $entry_id,
			'form_id'  => (string) $form_id,
		];
		foreach ( $this->parse_metadata_pairs( (string) ( $config['metadata_fields'] ?? '' ) ) as $key => $field_id ) {
			$metadata[ $key ] = $this->get_field_value( $field_id, $entry );
		}

		$mode = in_array( (string) ( $config['mode'] ?? 'payment' ), [ 'payment', 'subscription' ], true )
			? (string) $config['mode']
			: 'payment';

		$body = [
			'mode'                      => $mode,
			'payment_method_types[0]'   => 'card',
			'line_items[0][price_data][currency]'                       => $currency,
			'line_items[0][price_data][unit_amount]'                    => (string) $unit_amount,
			'line_items[0][price_data][product_data][name]'             => $description,
			'line_items[0][quantity]'                                   => '1',
			'success_url'                                               => $success_url,
			'cancel_url'                                                => $cancel_url,
		];
		if ( '' !== $customer_email && is_email( $customer_email ) ) {
			$body['customer_email'] = $customer_email;
		}
		foreach ( $metadata as $key => $val ) {
			$body[ 'metadata[' . $key . ']' ] = (string) $val;
		}

		$response = wp_remote_post( self::STRIPE_API, [
			'timeout'  => 15,
			'blocking' => true,
			'headers'  => [
				'Authorization' => 'Bearer ' . $secret_key,
				'Content-Type'  => 'application/x-www-form-urlencoded',
			],
			'body'     => $body,
		] );

		if ( is_wp_error( $response ) ) {
			do_action( 'flowforms_stripe_error', $response->get_error_message(), $entry, $form );
			return;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		$data = json_decode( (string) wp_remote_retrieve_body( $response ), true );

		if ( $code < 200 || $code >= 300 || ! is_array( $data ) || empty( $data['id'] ) || empty( $data['url'] ) ) {
			do_action( 'flowforms_stripe_error', $data['error']['message'] ?? 'unknown', $entry, $form );
			return;
		}

		$repo = $this->get_entry_repo();
		if ( $repo ) {
			$repo->set_meta( $entry_id, 'stripe_session_id',  (string) $data['id'] );
			$repo->set_meta( $entry_id, 'stripe_session_url', (string) $data['url'] );
			$repo->set_meta( $entry_id, 'stripe_status',      'pending' );
			$repo->set_meta( $entry_id, 'redirect_url',       (string) $data['url'] );
			if ( ! empty( $config['webhook_signing_secret'] ) ) {
				$repo->set_meta( $entry_id, 'stripe_webhook_secret', (string) $config['webhook_signing_secret'] );
			}
		}
	}

	/**
	 * @return array<string,string> key => field_id
	 */
	private function parse_metadata_pairs( string $raw ): array {
		$out = [];
		foreach ( preg_split( '/\r\n|\r|\n/', $raw ) ?: [] as $line ) {
			$line = trim( $line );
			if ( '' === $line || '=' === $line[0] ) {
				continue;
			}
			$parts = explode( '=', $line, 2 );
			if ( 2 !== count( $parts ) ) {
				continue;
			}
			$key   = sanitize_key( trim( $parts[0] ) );
			$value = trim( $parts[1] );
			if ( '' !== $key && '' !== $value ) {
				$out[ $key ] = $value;
			}
		}
		return $out;
	}

	private function get_entry_repo(): ?EntryRepository {
		if ( ! class_exists( \FlowForms\Plugin::class ) ) {
			return null;
		}
		try {
			$container = \FlowForms\Plugin::instance()->container();
			return $container->get( EntryRepository::class );
		} catch ( \Throwable $e ) {
			return null;
		}
	}
}
