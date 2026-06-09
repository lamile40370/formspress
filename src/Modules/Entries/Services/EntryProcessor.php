<?php

namespace FlowForms\Modules\Entries\Services;

use FlowForms\Extensibility\FieldTypes\FieldTypeRegistry;
use FlowForms\Extensibility\SpamProviders\SpamProviderRegistry;
use FlowForms\Extensibility\Validators\ValidatorRegistry;
use FlowForms\Modules\Actions\Services\ActionRunner;
use FlowForms\Modules\Entries\Services\Conditional\ConditionEvaluator;
use FlowForms\Modules\Forms\Services\FormRepository;

class EntryProcessor {

	public function __construct(
		private readonly FormRepository $form_repo,
		private readonly EntryRepository $entry_repo,
		private readonly ActionRunner $action_runner,
		private readonly ConditionEvaluator $conditions,
		private readonly FieldTypeRegistry $field_types,
		private readonly ValidatorRegistry $validators,
		private readonly SpamProviderRegistry $spam_providers,
	) {}

	public function process( int $form_id, array $submitted_values, array $request_meta = [] ): array {
		$form = $this->form_repo->get( $form_id );

		if ( ! $form || 'active' !== $form['status'] ) {
			return [ 'success' => false, 'message' => __( 'This form is not available.', 'formspress' ) ];
		}

		if ( ! empty( $form['settings']['honeypot'] ) ) {
			$honeypot_value = $submitted_values['_ff_hp'] ?? '';
			if ( $honeypot_value !== '' ) {
				return [ 'success' => true, 'message' => $this->get_success_message( $form ) ];
			}
		}

		/* Global anti-spam verification (reCAPTCHA, Turnstile, hCaptcha, …). */
		$spam_check = $this->verify_spam( $submitted_values, $request_meta );
		if ( true !== $spam_check ) {
			return [ 'success' => false, 'message' => $spam_check ];
		}

		// Conditional display is a Pro feature. When unavailable, every field
		// remains active so manually injected conditions cannot bypass validation.
		$visible_field_ids = apply_filters( 'flowforms_can_use_conditional_logic', false )
			? $this->conditions->visibleFieldIds( $form['fields'], $submitted_values )
			: null;

		$validation = $this->validate_fields( $form['fields'], $submitted_values, $visible_field_ids );

		if ( ! $validation['valid'] ) {
			return [ 'success' => false, 'errors' => $validation['errors'] ];
		}

		$entry_values = $this->build_entry_values( $form['fields'], $submitted_values, $visible_field_ids );

		$entry_values = apply_filters( 'flowforms_entry_values', $entry_values, $form['fields'], $submitted_values, $form );

		$quiz_result = apply_filters( 'flowforms_entry_quiz_result', null, $form, $entry_values );

		$entry_id = $this->entry_repo->create( $form_id, $entry_values, $request_meta, $quiz_result );

		if ( ! $entry_id ) {
			return [ 'success' => false, 'message' => __( 'Failed to save submission.', 'formspress' ) ];
		}

		$entry = $this->entry_repo->get( $entry_id );

		do_action( 'flowforms_entry_created', $entry, $form );

		$this->action_runner->run( $form, $entry );

		/* Re-fetch after actions: a Stripe (or similar) action may have
		 * stamped meta on the entry indicating we need to redirect. */
		$entry = $this->entry_repo->get( $entry_id );

		$result = [
			'success'    => true,
			'entry_id'   => $entry_id,
			'message'    => $this->get_success_message( $form ),
			'action'     => $form['settings']['success_action'] ?? 'message',
			'redirect'   => $form['settings']['redirect_url'] ?? '',
		];

		/* Action-driven redirect (e.g. Stripe Checkout). */
		if ( ! empty( $entry['redirect_url'] ) ) {
			$result['action']   = 'redirect';
			$result['redirect'] = (string) $entry['redirect_url'];
		}

		if ( $quiz_result ) {
			$result['score']         = (float) $quiz_result['score'];
			$result['max_score']     = (float) $quiz_result['max_score'];
			$result['result_screen'] = $quiz_result['result_screen'];
		}

		return apply_filters( 'flowforms_submit_response', $result, $form, $entry );
	}

	private function verify_spam( array $submitted_values, array $request_meta ): true|string {
		$provider = $this->spam_providers->get_active();
		if ( null === $provider ) {
			return true;
		}
		$config = $this->spam_providers->get_active_config();
		$token  = (string) ( $submitted_values[ $provider->get_token_field_name() ] ?? '' );
		$ip     = (string) ( $request_meta['ip_address'] ?? '' );

		return $provider->verify( $token, $config, $ip );
	}

	private function validate_fields( array $fields, array $values, ?array $visible_field_ids = null ): array {
		$errors = [];

		// Flatten rows/cols so nested fields participate in validation.
		$flat = $this->conditions->flattenFields( $fields );

		foreach ( $flat as $field ) {
			$field_id = $field['id'] ?? '';
			$value    = $values[ $field_id ] ?? '';

			// Skip validation for fields hidden by conditional logic.
			if ( null !== $visible_field_ids && ! in_array( $field_id, $visible_field_ids, true ) ) {
				continue;
			}

			if ( ! apply_filters( 'flowforms_should_validate_field', true, $field, $value ) ) {
				continue;
			}

			if ( ! empty( $field['required'] ) && $this->is_empty( $value ) ) {
				$errors[ $field_id ] = sprintf(
					__( '%s is required.', 'formspress' ),
					$field['label'] ?? $field_id
				);
				continue;
			}

			/* Type-level validation (via FieldTypeRegistry → AbstractFieldType::validate). */
			$type = $this->field_types->get( (string) ( $field['type'] ?? '' ) );
			if ( $type && ! $this->is_empty( $value ) ) {
				$result = $type->validate( $value, $field );
				if ( true !== $result ) {
					$errors[ $field_id ] = $result;
					continue;
				}
			}

			/* Per-field declared validators. */
			foreach ( (array) ( $field['validators'] ?? [] ) as $validator_def ) {
				$vid    = (string) ( $validator_def['id'] ?? '' );
				$config = (array) ( $validator_def['config'] ?? [] );
				$validator = $this->validators->get( $vid );
				if ( ! $validator ) {
					continue;
				}
				$result = $validator->validate( $value, $config, $field );
				if ( true !== $result ) {
					$errors[ $field_id ] = $result;
					break;
				}
			}
		}

		return [ 'valid' => empty( $errors ), 'errors' => $errors ];
	}

	private function is_empty( mixed $value ): bool {
		if ( is_array( $value ) ) {
			return empty( array_filter( $value, fn( $v ) => $v !== '' && $v !== null ) );
		}
		return $value === '' || $value === null;
	}

	private function build_entry_values( array $fields, array $submitted_values, ?array $visible_field_ids = null ): array {
		$values = [];

		$flat = $this->conditions->flattenFields( $fields );
		$checkout_total = $this->compute_checkout_total( $flat, $submitted_values, $visible_field_ids );

		foreach ( $flat as $field ) {
			$field_id   = $field['id'] ?? '';
			$field_type = (string) ( $field['type'] ?? 'text' );

			$type = $this->field_types->get( $field_type );
			if ( $type && ! $type->is_storable() ) {
				continue;
			}

			// Drop hidden-by-conditions answers so they aren't persisted.
			if ( null !== $visible_field_ids && ! in_array( $field_id, $visible_field_ids, true ) ) {
				continue;
			}

			$raw_value = 'total' === $field_type
				? number_format( $checkout_total, 2, '.', '' )
				: ( $submitted_values[ $field_id ] ?? '' );

			if ( $type ) {
				$value = (string) $type->sanitize( $raw_value, $field );
			} else {
				$value = is_array( $raw_value )
					? implode( ', ', array_map( 'sanitize_text_field', $raw_value ) )
					: sanitize_text_field( (string) $raw_value );
			}

			$values[] = [
				'field_id'    => $field_id,
				'field_label' => $field['label'] ?? $field_id,
				'field_value' => $value,
			];
		}

		return $values;
	}

	private function compute_checkout_total( array $flat_fields, array $submitted_values, ?array $visible_field_ids = null ): float {
		$total = 0.0;

		foreach ( $flat_fields as $field ) {
			if ( 'product' !== ( $field['type'] ?? '' ) ) {
				continue;
			}

			$field_id = (string) ( $field['id'] ?? '' );
			if ( '' === $field_id ) {
				continue;
			}

			if ( null !== $visible_field_ids && ! in_array( $field_id, $visible_field_ids, true ) ) {
				continue;
			}

			$quantity = is_numeric( $submitted_values[ $field_id ] ?? null )
				? (float) $submitted_values[ $field_id ]
				: 0.0;
			$quantity = max( 0.0, $quantity );

			$min = max( 0.0, (float) ( $field['min_quantity'] ?? 0 ) );
			$quantity = max( $min, $quantity );

			if ( isset( $field['max_quantity'] ) && null !== $field['max_quantity'] && '' !== $field['max_quantity'] ) {
				$quantity = min( $quantity, (float) $field['max_quantity'] );
			}

			$price = max( 0.0, (float) ( $field['price'] ?? 0 ) );
			$total += $price * $quantity;
		}

		return round( $total, 2 );
	}

	private function get_success_message( array $form ): string {
		return $form['settings']['success_message'] ?? __( 'Thank you! Your submission has been received.', 'formspress' );
	}
}
