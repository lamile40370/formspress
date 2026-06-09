<?php

namespace FlowForms\Modules\Actions\Services;

abstract class AbstractAction {

	abstract public function get_id(): string;

	abstract public function get_label(): string;

	abstract public function run( array $action_config, array $entry, array $form ): void;

	/**
	 * Field descriptors used to auto-render the action's settings UI.
	 *
	 * Each descriptor is an associative array with at least `key`, `type` and `label`.
	 * Supported `type` values: text, textarea, select, toggle, url, password, number,
	 * multi-select, field-select, field-mapping-repeater, email-designer, email-template-picker,
	 * wp-page-token, key-value-repeater, section.
	 * Optional keys: help, placeholder, default, options (select), rows (textarea),
	 * min/max (number), depends_on.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	abstract public function get_fields(): array;

	/**
	 * Optional icon name or inline SVG markup.
	 */
	public function get_icon(): string {
		return '';
	}

	/**
	 * Optional one-line description shown in the inspector.
	 */
	public function get_description(): string {
		return '';
	}

	protected function resolve_variables( string $template, array $entry, array $form ): string {
		$template = str_replace( '{form_title}', $form['title'] ?? '', $template );
		$template = str_replace( '{entry_id}', (string) ( $entry['id'] ?? '' ), $template );
		$template = str_replace( '{entry_date}', $entry['created_at'] ?? '', $template );
		$template = str_replace( '{site_name}', get_bloginfo( 'name' ), $template );
		$template = str_replace( '{site_url}', get_site_url(), $template );

		foreach ( $entry['values'] ?? [] as $value ) {
			$tag      = '{field:' . $value['field_id'] . '}';
			$template = str_replace( $tag, $value['field_value'] ?? '', $template );
			$tag_label = '{label:' . $value['field_id'] . '}';
			$template  = str_replace( $tag_label, $value['field_label'] ?? '', $template );
		}

		return $template;
	}

	/**
	 * Look up a submitted field value by its field ID.
	 *
	 * Used by integrations where the user enters a literal field ID (e.g. `email`)
	 * rather than a merge tag (`{field:email}`) — we look the value up directly.
	 */
	protected function get_field_value( string $field_id, array $entry ): string {
		if ( '' === $field_id ) {
			return '';
		}

		foreach ( $entry['values'] ?? [] as $value ) {
			if ( ( $value['field_id'] ?? '' ) === $field_id ) {
				return (string) ( $value['field_value'] ?? '' );
			}
		}

		return '';
	}

	protected function build_entry_html( array $entry ): string {
		$html = '<table style="border-collapse:collapse;width:100%">';

		foreach ( $entry['values'] ?? [] as $value ) {
			$html .= '<tr>';
			$html .= '<td style="padding:8px;border:1px solid #ddd;font-weight:bold;width:30%">' . esc_html( $value['field_label'] ?? $value['field_id'] ) . '</td>';
			$html .= '<td style="padding:8px;border:1px solid #ddd">' . nl2br( esc_html( $value['field_value'] ?? '' ) ) . '</td>';
			$html .= '</tr>';
		}

		$html .= '</table>';

		return $html;
	}
}
