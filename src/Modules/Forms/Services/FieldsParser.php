<?php

namespace FlowForms\Modules\Forms\Services;

/**
 * Single source of truth for reading a form's `fields` column.
 *
 * The column holds one of two shapes:
 *  - **Block markup** (new) — e.g. `<!-- wp:formspress/field-text {...} /-->`
 *    produced by the Gutenberg-iso builder via `serialize(blocks)`.
 *  - **JSON array** (legacy) — flat array of field objects produced by the
 *    custom builder.
 *
 * Everything downstream (FormRenderer, ExportEntries, EntryProcessor)
 * expects the JSON shape, so this parser normalises markup → array.
 */
class FieldsParser {

	/**
	 * Detect which storage shape `$raw` is in.
	 */
	public static function is_markup( string $raw ): bool {
		$raw = ltrim( $raw );
		return 0 === strpos( $raw, '<!-- wp:formspress/' ) || 0 === strpos( $raw, '<!-- wp:' );
	}

	/**
	 * Normalise the raw column value into the legacy schema array used
	 * by FormRenderer + actions + exports.
	 *
	 * @param string|array|null $raw The column value (already-decoded array
	 *                               accepted for safety — returns it as-is).
	 * @return array<int, array<string, mixed>>
	 */
	public static function to_schema( $raw ): array {
		if ( is_array( $raw ) ) {
			return $raw;
		}
		if ( ! is_string( $raw ) || '' === trim( $raw ) ) {
			return [];
		}

		if ( self::is_markup( $raw ) ) {
			return self::blocks_to_schema( \parse_blocks( $raw ) );
		}

		$decoded = json_decode( $raw, true );
		return is_array( $decoded ) ? $decoded : [];
	}

	/**
	 * Walk a parse_blocks() result and produce a field schema array.
	 *
	 * @param array<int, array<string, mixed>> $blocks
	 * @return array<int, array<string, mixed>>
	 */
	public static function blocks_to_schema( array $blocks ): array {
		$fields = [];
		self::walk_blocks( $blocks, $fields );
		return $fields;
	}

	/**
	 * Depth-first walk over a parsed block tree. Pulls every
	 * `formspress/field-*` block out, regardless of how deep it sits
	 * inside container blocks (`core/group`, `core/columns`,
	 * `core/column`, custom wrappers from add-ons, etc.).
	 *
	 * The Gutenberg-iso builder wraps every form in a root `core/group`
	 * so this recursion is the only way fields surface to the renderer.
	 *
	 * @param array<int, array<string, mixed>> $blocks
	 * @param array<int, array<string, mixed>> $fields  Out-param — receives the schema entries in order.
	 */
	private static function walk_blocks( array $blocks, array &$fields ): void {
		foreach ( $blocks as $block ) {
			$field = self::block_to_field( $block );
			if ( null !== $field ) {
				$fields[] = $field;
				continue;
			}

			$inner = $block['innerBlocks'] ?? null;
			if ( is_array( $inner ) && ! empty( $inner ) ) {
				self::walk_blocks( $inner, $fields );
			}
		}
	}

	/**
	 * Map a single block to the legacy field shape `render_field()` knows.
	 *
	 * @param array<string, mixed> $block
	 * @return array<string, mixed>|null
	 */
	private static function block_to_field( array $block ): ?array {
		$name = $block['blockName'] ?? '';
		if ( '' === $name || 0 !== strpos( $name, 'formspress/field-' ) ) {
			// Skip non-field blocks — they're cosmetic (paragraph, heading,
			// spacer, etc.) and not part of the data model.
			return null;
		}

		$type  = substr( $name, strlen( 'formspress/field-' ) );
		$attrs = is_array( $block['attrs'] ?? null ) ? $block['attrs'] : [];
		$text_blocks = self::inner_text_blocks( $block );
		$label       = trim( (string) ( $attrs['label'] ?? '' ) );
		$help        = trim( (string) ( $attrs['help'] ?? '' ) );

		$base = [
			'id'           => (string) ( $attrs['fieldId']     ?? $attrs['id']     ?? '' ),
			'type'         => $type,
			'label'        => '' !== $label ? $label : ( $text_blocks[0] ?? '' ),
			'required'     => ! empty( $attrs['required'] ),
			'help'         => '' !== $help ? $help : ( $text_blocks[1] ?? '' ),
			'placeholder'  => (string) ( $attrs['placeholder'] ?? '' ),
			'default'      => (string) ( $attrs['defaultValue'] ?? '' ),
		];

		if ( ! empty( $attrs['conditions'] ) && is_array( $attrs['conditions'] ) ) {
			$base['conditions'] = $attrs['conditions'];
		}

		// Per-block extras.
		switch ( $type ) {
			case 'total':
				if ( '' === $base['id'] ) {
					$base['id'] = 'total';
				}
				if ( '' === $base['label'] ) {
					$base['label'] = __( 'Total', 'formspress' );
				}
				$base['currency'] = (string) ( $attrs['currency'] ?? 'EUR' );
				break;
			case 'textarea':
				if ( isset( $attrs['rows'] ) ) {
					$base['rows'] = (int) $attrs['rows'];
				}
				break;
			case 'number':
				foreach ( [ 'min', 'max', 'step' ] as $k ) {
					if ( isset( $attrs[ $k ] ) && '' !== $attrs[ $k ] ) {
						$base[ $k ] = $attrs[ $k ] + 0;
					}
				}
				break;
			case 'select':
			case 'radio':
			case 'checkbox':
				$opts = is_array( $attrs['options'] ?? null ) ? $attrs['options'] : [];
				$base['options'] = array_map(
					static function ( $o ) {
						if ( is_string( $o ) ) {
							return [ 'label' => $o, 'value' => $o ];
						}
						$label = (string) ( $o['label'] ?? '' );
						$value = (string) ( $o['value'] ?? $label );
						return [ 'label' => $label, 'value' => $value ];
					},
					$opts
				);
				break;
			case 'product':
				$base['product_name']  = (string) ( $attrs['productName'] ?? $base['label'] );
				if ( '' === $base['label'] ) {
					$base['label'] = '' !== $base['product_name'] ? $base['product_name'] : __( 'Product', 'formspress' );
				}
				$base['price']         = isset( $attrs['price'] ) ? (float) $attrs['price'] : 0.0;
				$base['currency']      = (string) ( $attrs['currency'] ?? 'EUR' );
				$base['min_quantity']  = isset( $attrs['minQuantity'] ) ? (float) $attrs['minQuantity'] : 0.0;
				$base['max_quantity']  = isset( $attrs['maxQuantity'] ) ? (float) $attrs['maxQuantity'] : null;
				$base['step_quantity'] = isset( $attrs['stepQuantity'] ) ? (float) $attrs['stepQuantity'] : 1.0;
				break;
			case 'page-break':
				$base['type'] = 'page_break';
				break;
			case 'submit':
				// The submit block isn't a "field" in the legacy sense — it
				// surfaces as the form's submit button text + alignment.
				// Return null so it's not added to the schema; the renderer
				// derives the submit button from form settings.
				return null;
		}

		return $base;
	}

	/**
	 * Extract readable text from a field's native inner blocks. This keeps
	 * exports, notifications, and entry labels working when the visual label is
	 * authored as a normal Gutenberg paragraph/heading instead of the legacy
	 * `label` attribute.
	 *
	 * @param array<string, mixed> $block
	 * @return array<int, string>
	 */
	private static function inner_text_blocks( array $block ): array {
		$inner = is_array( $block['innerBlocks'] ?? null ) ? $block['innerBlocks'] : [];
		$out   = [];

		foreach ( $inner as $child ) {
			self::collect_text_blocks( $child, $out );
		}

		return array_values( array_filter( $out, static fn ( $text ) => '' !== $text ) );
	}

	/**
	 * @param array<string, mixed> $block
	 * @param array<int, string>   $out
	 */
	private static function collect_text_blocks( array $block, array &$out ): void {
		$name = (string) ( $block['blockName'] ?? '' );
		if ( 0 === strpos( $name, 'formspress/field-' ) ) {
			return;
		}

		if ( in_array( $name, [ 'core/paragraph', 'core/heading', 'core/list', 'core/list-item' ], true ) ) {
			$text = self::block_plain_text( $block );
			if ( '' !== $text ) {
				$out[] = $text;
			}
		}

		$inner = is_array( $block['innerBlocks'] ?? null ) ? $block['innerBlocks'] : [];
		foreach ( $inner as $child ) {
			self::collect_text_blocks( $child, $out );
		}
	}

	/**
	 * @param array<string, mixed> $block
	 */
	private static function block_plain_text( array $block ): string {
		$attrs = is_array( $block['attrs'] ?? null ) ? $block['attrs'] : [];
		$html  = '';

		foreach ( [ 'content', 'values', 'text' ] as $key ) {
			if ( isset( $attrs[ $key ] ) && is_string( $attrs[ $key ] ) ) {
				$html = $attrs[ $key ];
				break;
			}
		}

		if ( '' === $html ) {
			$html = (string) ( $block['innerHTML'] ?? '' );
		}

		$text = html_entity_decode( wp_strip_all_tags( $html ), ENT_QUOTES, get_bloginfo( 'charset' ) ?: 'UTF-8' );
		return trim( preg_replace( '/\s+/', ' ', $text ) ?? '' );
	}

	/**
	 * Extract submit-button settings (text + alignment) from block markup,
	 * if the form has a `formspress/field-submit` block. Returns null when
	 * the form is in legacy JSON shape (no submit block).
	 *
	 * @param string|array|null $raw
	 * @return array{buttonText: string, alignment: string}|null
	 */
	public static function extract_submit( $raw ): ?array {
		if ( ! is_string( $raw ) || ! self::is_markup( $raw ) ) {
			return null;
		}
		return self::find_submit_recursive( \parse_blocks( $raw ) );
	}

	public static function markup_has_submit( string $raw ): bool {
		if ( ! self::is_markup( $raw ) ) {
			return false;
		}

		return self::has_submit_recursive( \parse_blocks( $raw ) );
	}

	/**
	 * @param array<int, array<string, mixed>> $blocks
	 */
	private static function has_submit_recursive( array $blocks ): bool {
		foreach ( $blocks as $block ) {
			if ( 'formspress/field-submit' === ( $block['blockName'] ?? '' ) ) {
				return true;
			}

			$inner = $block['innerBlocks'] ?? null;
			if ( is_array( $inner ) && ! empty( $inner ) && self::has_submit_recursive( $inner ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @param array<int, array<string, mixed>> $blocks
	 */
	private static function find_submit_recursive( array $blocks ): ?array {
		foreach ( $blocks as $block ) {
			if ( 'formspress/field-submit' === ( $block['blockName'] ?? '' ) ) {
				return self::extract_submit_inner( $block );
			}
			$inner = $block['innerBlocks'] ?? null;
			if ( is_array( $inner ) && ! empty( $inner ) ) {
				$nested = self::find_submit_recursive( $inner );
				if ( null !== $nested ) {
					return $nested;
				}
			}
		}
		return null;
	}

	/**
	 * The submit block is a thin wrapper around a single `core/button`
	 * (since v2 of the standard builder). The inner button owns text,
	 * color, typography, border, etc. We read its attributes here so the
	 * front-end renderer can emit `<button type="submit">` with the
	 * styling preserved.
	 *
	 * Falls back to the legacy attribute shape (`buttonText` / `alignment`
	 * directly on the wrapper) for forms saved with the older builder.
	 *
	 * @param array<string, mixed> $wrapper
	 */
	private static function extract_submit_inner( array $wrapper ): array {
		$attrs = is_array( $wrapper['attrs'] ?? null ) ? $wrapper['attrs'] : [];
		$inner = is_array( $wrapper['innerBlocks'] ?? null ) ? $wrapper['innerBlocks'] : [];

		// New shape: first inner block is `core/button`.
		foreach ( $inner as $child ) {
			if ( 'core/button' !== ( $child['blockName'] ?? '' ) ) {
				continue;
			}
			$btn = is_array( $child['attrs'] ?? null ) ? $child['attrs'] : [];
			return [
				'buttonText' => (string) ( $btn['text']   ?? __( 'Submit', 'formspress' ) ),
				'alignment'  => (string) ( $attrs['align'] ?? '' ),
				// Pass through the full button attributes + the parsed
				// innerHTML so the renderer can mirror the native button
				// classes/styles (theme.json variables, border-radius,
				// background color, etc.).
				'button'     => $btn,
				'innerHTML'  => (string) ( $child['innerHTML'] ?? '' ),
			];
		}

		// Legacy shape: wrapper carries the attributes directly.
		return [
			'buttonText' => (string) ( $attrs['buttonText'] ?? __( 'Submit', 'formspress' ) ),
			'alignment'  => (string) ( $attrs['alignment']  ?? '' ),
		];
	}
}
