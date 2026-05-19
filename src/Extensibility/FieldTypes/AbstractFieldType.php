<?php

namespace FlowForms\Extensibility\FieldTypes;

/**
 * Base class for FlowForms field types.
 *
 * Third-party plugins extend this class and register on the
 * `flowforms_register_field_types` hook to add custom field types
 * to the form builder.
 */
abstract class AbstractFieldType {

	/**
	 * Stable, unique id (snake_case). Used in form JSON as `field.type`.
	 */
	abstract public function get_id(): string;

	/**
	 * Human-readable label shown in the field picker.
	 */
	abstract public function get_label(): string;

	/**
	 * Picker group: basic | choice | advanced | layout | custom.
	 */
	abstract public function get_group(): string;

	/**
	 * Dashicon name (without `dashicons-` prefix) used in the picker.
	 */
	abstract public function get_icon(): string;

	/**
	 * Default value used when a new instance of the field is added.
	 */
	public function get_default_value(): mixed {
		return '';
	}

	/**
	 * Field descriptors used to auto-render this field's settings UI in the inspector.
	 *
	 * Same descriptor format as AbstractAction::get_fields().
	 * Supported `type` values: text, textarea, select, toggle, url, password, number.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function get_settings_schema(): array {
		return [];
	}

	/**
	 * Render the field's frontend HTML for a standard (non-flow) form.
	 *
	 * Receives the field's stored configuration (id, label, required, …) and
	 * returns escaped HTML. The wrapping label/description/error block is
	 * provided by FormRenderer — this returns only the input control.
	 *
	 * @param array<string, mixed> $field
	 */
	abstract public function render_frontend( array $field ): string;

	/**
	 * Validate a submitted value for this field type.
	 *
	 * Return `true` for valid, or an error message string for invalid.
	 *
	 * @param array<string, mixed> $field
	 */
	public function validate( mixed $value, array $field ): true|string {
		return true;
	}

	/**
	 * Sanitize/normalize a submitted value before persistence.
	 */
	public function sanitize( mixed $value, array $field ): mixed {
		if ( is_array( $value ) ) {
			return implode( ', ', array_map( 'sanitize_text_field', $value ) );
		}
		return sanitize_text_field( (string) $value );
	}

	/**
	 * Whether values for this field should be excluded from entry storage.
	 * Useful for layout-only types (section, page_break, row).
	 */
	public function is_storable(): bool {
		return true;
	}

	/**
	 * Optional one-line description shown in the picker tooltip.
	 */
	public function get_description(): string {
		return '';
	}
}
