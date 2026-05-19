<?php

namespace FlowForms\Modules\Entries\Services;

use FlowForms\Extensibility\FieldTypes\Calculations\FormulaEvaluator;
use FlowForms\Extensibility\FieldTypes\FieldTypeRegistry;
use FlowForms\Extensibility\SpamProviders\SpamProviderRegistry;
use FlowForms\Extensibility\Validators\ValidatorRegistry;
use FlowForms\Modules\Actions\Services\ActionRunner;
use FlowForms\Modules\Entries\Services\Conditional\ConditionEvaluator;
use FlowForms\Modules\Entries\Services\Quiz\QuizScorer;
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
			return [ 'success' => false, 'message' => __( 'This form is not available.', 'flowforms' ) ];
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

		// Compute which fields are currently "visible" given submitted values.
		// Validation only runs on visible fields; hidden fields are stripped
		// from the persisted entry to avoid storing answers the user couldn't see.
		$visible_field_ids = $this->conditions->visibleFieldIds( $form['fields'], $submitted_values );

		$validation = $this->validate_fields( $form['fields'], $submitted_values, $visible_field_ids );

		if ( ! $validation['valid'] ) {
			return [ 'success' => false, 'errors' => $validation['errors'] ];
		}

		$entry_values = $this->build_entry_values( $form['fields'], $submitted_values, $visible_field_ids );

		/* Recompute calculation field values server-side from the formula —
		 * never trust whatever the client posted in the hidden input. */
		$entry_values = $this->apply_calculations( $form['fields'], $entry_values );

		/* Quiz scoring — sum option scores per answer, find matching screen. */
		$quiz_result = $this->score_quiz( $form, $entry_values );

		$entry_id = $this->entry_repo->create( $form_id, $entry_values, $request_meta, $quiz_result );

		if ( ! $entry_id ) {
			return [ 'success' => false, 'message' => __( 'Failed to save submission.', 'flowforms' ) ];
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

		return $result;
	}

	/**
	 * Walk every calculation field, evaluate its formula using the other
	 * submitted field values, and overwrite the entry's stored value.
	 *
	 * @param array<int,array<string,mixed>> $fields
	 * @param array<int,array<string,mixed>> $entry_values
	 * @return array<int,array<string,mixed>>
	 */
	private function apply_calculations( array $fields, array $entry_values ): array {
		$flat = $this->conditions->flattenFields( $fields );

		$calc_fields = array_filter( $flat, fn( $f ) => 'calculation' === ( $f['type'] ?? '' ) );
		if ( empty( $calc_fields ) ) {
			return $entry_values;
		}

		/* Build a quick value map for the evaluator. */
		$values_map = [];
		foreach ( $entry_values as $v ) {
			$values_map[ $v['field_id'] ?? '' ] = $v['field_value'] ?? '';
		}

		$evaluator = new FormulaEvaluator();

		foreach ( $calc_fields as $field ) {
			$formula  = (string) ( $field['formula'] ?? '' );
			$field_id = (string) ( $field['id'] ?? '' );
			if ( '' === $formula || '' === $field_id ) {
				continue;
			}
			$computed             = $evaluator->evaluate( $formula, $values_map );
			$values_map[ $field_id ] = $computed; // for downstream calcs that reference earlier calcs

			$replaced = false;
			foreach ( $entry_values as &$v ) {
				if ( ( $v['field_id'] ?? '' ) === $field_id ) {
					$v['field_value'] = (string) $computed;
					$replaced         = true;
					break;
				}
			}
			unset( $v );

			if ( ! $replaced ) {
				$entry_values[] = [
					'field_id'    => $field_id,
					'field_label' => $field['label'] ?? $field_id,
					'field_value' => (string) $computed,
				];
			}
		}

		return $entry_values;
	}

	/**
	 * Compute total quiz score + matching result screen. Returns null when
	 * quiz mode is not enabled on the form.
	 *
	 * @param array<string,mixed>           $form
	 * @param array<int,array<string,mixed>> $entry_values
	 * @return array{score:float,max_score:float,result_screen:?array<string,mixed>}|null
	 */
	private function score_quiz( array $form, array $entry_values ): ?array {
		$quiz = $form['settings']['quiz'] ?? null;
		if ( ! is_array( $quiz ) || empty( $quiz['enabled'] ) ) {
			return null;
		}
		$scorer = new QuizScorer();
		return $scorer->score( $form['fields'] ?? [], $entry_values, $quiz );
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

			/* Calculation fields are never user-input — never validate "required". */
			if ( 'calculation' === ( $field['type'] ?? '' ) ) {
				continue;
			}

			if ( ! empty( $field['required'] ) && $this->is_empty( $value ) ) {
				$errors[ $field_id ] = sprintf(
					__( '%s is required.', 'flowforms' ),
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

			$raw_value = $submitted_values[ $field_id ] ?? '';

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

	private function get_success_message( array $form ): string {
		return $form['settings']['success_message'] ?? __( 'Thank you! Your submission has been received.', 'flowforms' );
	}
}
