<?php

namespace FlowForms\Modules\Compat\Services;

/**
 * Single entry point used by FormRenderer / actions when a translatable
 * string needs to be displayed.
 *
 * Each compat provider (WPML, Polylang, ...) registers a callable via
 * `flowforms_translate_string` filter. The first non-null return wins.
 *
 * The `$context` argument follows WPML's convention — `domain` + `name`.
 * Example: TranslationManager::translate( 'My label', 'flowforms-form-123', 'field_email_label' )
 */
class TranslationManager {

	/**
	 * Translate a string. Returns the original string if no provider handles it.
	 */
	public static function translate( string $value, string $domain, string $name ): string {
		if ( '' === $value ) {
			return $value;
		}

		/**
		 * Filter: allow translation providers to translate a string.
		 *
		 * Providers should return the translated string or `null` to pass.
		 *
		 * @param string|null $translated Current candidate translation, or null.
		 * @param string      $value      Original (registered) string.
		 * @param string      $domain     Translation domain.
		 * @param string      $name       Unique string name within the domain.
		 */
		$translated = apply_filters( 'flowforms_translate_string', null, $value, $domain, $name );

		if ( is_string( $translated ) && '' !== $translated ) {
			return $translated;
		}

		return $value;
	}

	/**
	 * Register a string so it becomes translatable in the provider UI.
	 * Idempotent — providers must dedupe internally.
	 */
	public static function register( string $value, string $domain, string $name ): void {
		if ( '' === $value ) {
			return;
		}

		/**
		 * Action: notify providers that a string is translatable.
		 *
		 * @param string $value  String value (the source language text).
		 * @param string $domain Translation domain.
		 * @param string $name   Unique string name within the domain.
		 */
		do_action( 'flowforms_register_string', $value, $domain, $name );
	}

	/**
	 * Walk a form schema and register every user-facing string.
	 * Returns the form unchanged.
	 *
	 * @param array<string, mixed> $form
	 */
	public static function register_form_strings( array $form ): void {
		$form_id = isset( $form['id'] ) ? (int) $form['id'] : 0;
		if ( $form_id <= 0 ) {
			return;
		}

		$domain = 'flowforms-form-' . $form_id;

		if ( ! empty( $form['title'] ) ) {
			self::register( (string) $form['title'], $domain, 'form_title' );
		}

		$schema = $form['schema'] ?? $form['fields'] ?? [];
		if ( ! is_array( $schema ) ) {
			return;
		}

		foreach ( $schema as $field ) {
			if ( ! is_array( $field ) ) {
				continue;
			}
			self::register_field_strings( $field, $domain );
		}

		$messages = $form['messages'] ?? [];
		if ( is_array( $messages ) ) {
			foreach ( $messages as $key => $msg ) {
				if ( is_string( $msg ) ) {
					self::register( $msg, $domain, 'message_' . $key );
				}
			}
		}
	}

	/**
	 * @param array<string, mixed> $field
	 */
	private static function register_field_strings( array $field, string $domain ): void {
		$id = isset( $field['id'] ) ? (string) $field['id'] : '';
		if ( '' === $id ) {
			return;
		}

		$keys = [ 'label', 'placeholder', 'help', 'description', 'default' ];
		foreach ( $keys as $key ) {
			if ( isset( $field[ $key ] ) && is_string( $field[ $key ] ) && '' !== $field[ $key ] ) {
				self::register( $field[ $key ], $domain, 'field_' . $id . '_' . $key );
			}
		}

		$options = $field['options'] ?? [];
		if ( is_array( $options ) ) {
			foreach ( $options as $i => $opt ) {
				if ( is_array( $opt ) && isset( $opt['label'] ) && is_string( $opt['label'] ) ) {
					self::register( $opt['label'], $domain, 'field_' . $id . '_option_' . $i );
				}
			}
		}

		// Recurse into nested fields (group/repeater/flow steps).
		$nested_keys = [ 'fields', 'children', 'steps' ];
		foreach ( $nested_keys as $nk ) {
			if ( isset( $field[ $nk ] ) && is_array( $field[ $nk ] ) ) {
				foreach ( $field[ $nk ] as $child ) {
					if ( is_array( $child ) ) {
						self::register_field_strings( $child, $domain );
					}
				}
			}
		}
	}

	/**
	 * Walk a form schema and translate every user-facing string in place.
	 *
	 * @param array<string, mixed> $form
	 * @return array<string, mixed>
	 */
	public static function translate_form( array $form ): array {
		$form_id = isset( $form['id'] ) ? (int) $form['id'] : 0;
		if ( $form_id <= 0 ) {
			return $form;
		}

		$domain = 'flowforms-form-' . $form_id;

		if ( ! empty( $form['title'] ) && is_string( $form['title'] ) ) {
			$form['title'] = self::translate( $form['title'], $domain, 'form_title' );
		}

		if ( isset( $form['schema'] ) && is_array( $form['schema'] ) ) {
			$form['schema'] = self::translate_fields( $form['schema'], $domain );
		} elseif ( isset( $form['fields'] ) && is_array( $form['fields'] ) ) {
			$form['fields'] = self::translate_fields( $form['fields'], $domain );
		}

		if ( isset( $form['messages'] ) && is_array( $form['messages'] ) ) {
			foreach ( $form['messages'] as $key => $msg ) {
				if ( is_string( $msg ) ) {
					$form['messages'][ $key ] = self::translate( $msg, $domain, 'message_' . $key );
				}
			}
		}

		return $form;
	}

	/**
	 * @param array<int, array<string, mixed>> $fields
	 * @return array<int, array<string, mixed>>
	 */
	private static function translate_fields( array $fields, string $domain ): array {
		foreach ( $fields as $i => $field ) {
			if ( ! is_array( $field ) ) {
				continue;
			}

			$id = isset( $field['id'] ) ? (string) $field['id'] : '';
			if ( '' === $id ) {
				continue;
			}

			$keys = [ 'label', 'placeholder', 'help', 'description', 'default' ];
			foreach ( $keys as $key ) {
				if ( isset( $field[ $key ] ) && is_string( $field[ $key ] ) ) {
					$field[ $key ] = self::translate( $field[ $key ], $domain, 'field_' . $id . '_' . $key );
				}
			}

			if ( isset( $field['options'] ) && is_array( $field['options'] ) ) {
				foreach ( $field['options'] as $oi => $opt ) {
					if ( is_array( $opt ) && isset( $opt['label'] ) && is_string( $opt['label'] ) ) {
						$field['options'][ $oi ]['label'] = self::translate(
							$opt['label'],
							$domain,
							'field_' . $id . '_option_' . $oi
						);
					}
				}
			}

			$nested_keys = [ 'fields', 'children', 'steps' ];
			foreach ( $nested_keys as $nk ) {
				if ( isset( $field[ $nk ] ) && is_array( $field[ $nk ] ) ) {
					$field[ $nk ] = self::translate_fields( $field[ $nk ], $domain );
				}
			}

			$fields[ $i ] = $field;
		}

		return $fields;
	}
}
