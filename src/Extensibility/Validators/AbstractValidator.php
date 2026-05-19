<?php

namespace FlowForms\Extensibility\Validators;

/**
 * Base class for FlowForms field validators.
 *
 * Validators are attached per-field in the form schema as:
 *     field.validators = [{ id: 'min_length', config: { min: 5 } }]
 *
 * Third-party plugins extend this class and register on the
 * `flowforms_register_validators` hook to add custom validators.
 */
abstract class AbstractValidator {

	/**
	 * Stable, unique id (snake_case). Used in form JSON as `validator.id`.
	 */
	abstract public function get_id(): string;

	/**
	 * Human-readable label shown in the Validators panel.
	 */
	abstract public function get_label(): string;

	/**
	 * Field descriptors for the validator's per-instance configuration.
	 *
	 * Same descriptor format as AbstractAction::get_fields().
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function get_settings_schema(): array {
		return [];
	}

	/**
	 * Optional one-line description.
	 */
	public function get_description(): string {
		return '';
	}

	/**
	 * Validate a submitted value.
	 *
	 * Return `true` for valid, or an error message string for invalid.
	 *
	 * @param array<string, mixed> $config Validator config from the form schema.
	 * @param array<string, mixed> $field  Field definition (id, type, label, …).
	 */
	abstract public function validate( mixed $value, array $config, array $field ): true|string;
}
