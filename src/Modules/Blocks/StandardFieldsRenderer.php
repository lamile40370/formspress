<?php

namespace FlowForms\Modules\Blocks;

/**
 * Server-side render callbacks for every `formspress/field-*` block
 * used by the standard form builder.
 *
 * The form builder is Gutenberg-iso: the user composes their form with
 * real blocks (a root `core/group`, optional `core/heading` /
 * `core/paragraph` / `core/columns`, plus our `formspress/field-*`
 * inputs and a `formspress/field-submit` wrapping a `core/button`).
 *
 * Native core blocks already have server renderers. Our custom field
 * blocks did NOT — they were JS-only — so when `FormRenderer` piped
 * the saved markup through `do_blocks()` they vanished. This class
 * plugs that gap: each `formspress/field-*` is registered server-side
 * with a callback that emits the exact same DOM shape the legacy
 * frontend runtime expects (`.ff-form__field` wrapper, `data-field-id`,
 * `.ff-form__label`, `.ff-form__input` / `.ff-form__textarea` /
 * `.ff-form__select` / `.ff-form__choices`, `.ff-form__field-error`).
 *
 * That keeps:
 *   - the user's parent `core/group` styling (padding, background,
 *     border, layout) — Gutenberg renders that natively
 *   - their headings / paragraphs / columns / dividers — also native
 *   - their custom `core/button` styling on the submit — also native
 *   - all the front-end JS (validation, save-and-resume, conditional
 *     logic, Interactivity API state) — unchanged because the field
 *     HTML shape is identical to the legacy renderer
 */
class StandardFieldsRenderer {

	/** @var array<string, callable> Block name → render callback. */
	private const RENDERERS = [
		'formspress/field-text'     => 'render_text',
		'formspress/field-email'    => 'render_email',
		'formspress/field-textarea' => 'render_textarea',
		'formspress/field-number'   => 'render_number',
		'formspress/field-select'   => 'render_select',
		'formspress/field-radio'    => 'render_radio',
		'formspress/field-checkbox' => 'render_checkbox',
		'formspress/field-submit'   => 'render_submit',
	];

	/**
	 * Register every field block with its render callback on `init`.
	 * Attribute schemas mirror the JS-side `index.js` of each block —
	 * keep in sync if you add an attribute in one place.
	 */
	public static function register(): void {
		$shared_attrs = [
			'fieldId'      => [ 'type' => 'string',  'default' => '' ],
			'label'        => [ 'type' => 'string',  'default' => '' ],
			'required'     => [ 'type' => 'boolean', 'default' => false ],
			'help'         => [ 'type' => 'string',  'default' => '' ],
			'placeholder'  => [ 'type' => 'string',  'default' => '' ],
			'defaultValue' => [ 'type' => 'string',  'default' => '' ],
			'inputStyle'   => [ 'type' => 'object',  'default' => [] ],
		];

		$options_attr = [
			'options' => [
				'type'    => 'array',
				'default' => [],
				'items'   => [ 'type' => 'object' ],
			],
		];

		$supports_full = [
			'html'       => false,
			'reusable'   => false,
			'color'      => [ 'background' => true, 'text' => true, 'link' => true ],
			'spacing'    => [ 'padding' => true, 'margin' => true ],
			'typography' => [ 'fontSize' => true, 'fontFamily' => true, 'lineHeight' => true ],
			'__experimentalBorder' => [ 'color' => true, 'radius' => true, 'width' => true, 'style' => true ],
		];

		$blocks_config = [
			'formspress/field-text'     => [ 'attrs' => $shared_attrs,                       'supports' => $supports_full ],
			'formspress/field-email'    => [ 'attrs' => $shared_attrs,                       'supports' => $supports_full ],
			'formspress/field-textarea' => [ 'attrs' => $shared_attrs + [ 'rows' => [ 'type' => 'number', 'default' => 4 ] ], 'supports' => $supports_full ],
			'formspress/field-number'   => [ 'attrs' => $shared_attrs + [ 'min' => [ 'type' => 'number' ], 'max' => [ 'type' => 'number' ], 'step' => [ 'type' => 'number' ] ], 'supports' => $supports_full ],
			'formspress/field-select'   => [ 'attrs' => $shared_attrs + $options_attr,       'supports' => $supports_full ],
			'formspress/field-radio'    => [ 'attrs' => $shared_attrs + $options_attr,       'supports' => $supports_full ],
			'formspress/field-checkbox' => [ 'attrs' => $shared_attrs + $options_attr,       'supports' => $supports_full ],
			'formspress/field-submit'   => [ 'attrs' => [], 'supports' => [ 'html' => false, 'reusable' => false, 'align' => [ 'wide', 'full' ] ] ],
		];

		foreach ( $blocks_config as $name => $config ) {
			// `register_block_type` is a no-op if the block was already
			// registered (e.g. via JS-side `wp.blocks.registerBlockType`
			// rehydrated on the editor screen). The PHP registration only
			// matters at front-end render time.
			if ( \WP_Block_Type_Registry::get_instance()->is_registered( $name ) ) {
				continue;
			}
			$callback = self::RENDERERS[ $name ];
			register_block_type( $name, [
				'api_version'     => 3,
				'attributes'      => $config['attrs'],
				'supports'        => $config['supports'],
				'render_callback' => [ self::class, $callback ],
			] );
		}
	}

	/* ---------------------------------------------------------------
	 * Render helpers
	 * ------------------------------------------------------------- */

	/**
	 * Build the wrapper attributes used by every field block. Pulls
	 * the user-set theme.json supports (color, spacing, typography,
	 * border) from `get_block_wrapper_attributes()`, then merges our
	 * required runtime hooks (the `.ff-form__field` wrapper class +
	 * `data-field-id` + conditional-logic data attr).
	 */
	private static function wrapper_attrs( string $field_id, array $extra_classes = [], array $extra_attrs = [] ): string {
		$classes = array_merge( [ 'ff-form__field' ], $extra_classes );
		return get_block_wrapper_attributes( array_merge( [
			'class'         => implode( ' ', $classes ),
			'id'            => 'ff-field-wrap-' . $field_id,
			'data-field-id' => $field_id,
		], $extra_attrs ) );
	}

	private static function label_html( string $field_id, string $label, bool $required ): string {
		$mark = $required
			? ' <span class="ff-form__required" aria-hidden="true">*</span>'
			. '<span class="screen-reader-text">' . esc_html__( '(required)', 'flowforms' ) . '</span>'
			: '';
		return sprintf(
			'<label for="ff-field-%1$s" class="ff-form__label">%2$s%3$s</label>',
			esc_attr( $field_id ),
			esc_html( $label ),
			$mark // phpcs:ignore WordPress.Security.EscapeOutput
		);
	}

	private static function help_html( string $field_id, string $help ): string {
		if ( '' === $help ) {
			return '';
		}
		return sprintf(
			'<p class="ff-form__description-text" id="ff-desc-%1$s">%2$s</p>',
			esc_attr( $field_id ),
			esc_html( $help )
		);
	}

	private static function field_content_html( string $field_id, array $attrs, string $content, bool $required ): string {
		$content = trim( $content );

		if ( '' === $content ) {
			return self::label_html( $field_id, (string) ( $attrs['label'] ?? '' ), $required )
				. self::help_html( $field_id, (string) ( $attrs['help'] ?? '' ) );
		}

		$mark = $required
			? '<span class="screen-reader-text">' . esc_html__( '(required)', 'flowforms' ) . '</span>'
			: '';

		return sprintf(
			'<div class="ff-form__field-content" id="ff-content-%1$s">%2$s%3$s</div>',
			esc_attr( $field_id ),
			$content, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner blocks are rendered by WordPress.
			$mark // phpcs:ignore WordPress.Security.EscapeOutput
		);
	}

	private static function has_inner_content( string $content ): bool {
		return '' !== trim( $content );
	}

	private static function error_slot( string $field_id ): string {
		return sprintf(
			'<div class="ff-form__field-error" id="ff-error-%1$s" role="alert" aria-live="polite" aria-atomic="true"></div>',
			esc_attr( $field_id )
		);
	}

	private static function css_length( $value ): string {
		$value = is_scalar( $value ) ? trim( (string) $value ) : '';
		if ( '' === $value ) {
			return '';
		}
		if ( preg_match( '/^-?\d+(\.\d+)?(px|em|rem|%|vh|vw)?$/', $value ) ) {
			return preg_match( '/[a-z%]+$/', $value ) ? $value : $value . 'px';
		}
		if ( preg_match( '/^var\(--[a-zA-Z0-9_-]+\)$/', $value ) ) {
			return $value;
		}
		if ( preg_match( '/^(rgb|rgba|hsl|hsla)\(\s*[-\d.%]+\s*,\s*[-\d.%]+\s*,\s*[-\d.%]+(?:\s*,\s*[\d.]+)?\s*\)$/i', $value ) ) {
			return $value;
		}
		return '';
	}

	private static function css_line_height( $value ): string {
		$value = is_scalar( $value ) ? trim( (string) $value ) : '';
		if ( '' === $value ) {
			return '';
		}
		if ( preg_match( '/^\d+(\.\d+)?$/', $value ) ) {
			return $value;
		}
		return self::css_length( $value );
	}

	private static function css_color( $value ): string {
		$value = is_scalar( $value ) ? trim( (string) $value ) : '';
		if ( '' === $value ) {
			return '';
		}
		if ( sanitize_hex_color( $value ) ) {
			return sanitize_hex_color( $value );
		}
		if ( preg_match( '/^var\(--[a-zA-Z0-9_-]+\)$/', $value ) ) {
			return $value;
		}
		return '';
	}

	private static function control_style_attr( array $attrs ): string {
		$style = is_array( $attrs['inputStyle'] ?? null ) ? $attrs['inputStyle'] : [];
		$rules = [];

		$color_map = [
			'textColor'       => 'color',
			'backgroundColor' => 'background-color',
		];
		foreach ( $color_map as $key => $property ) {
			$color = self::css_color( $style[ $key ] ?? '' );
			if ( $color ) {
				$rules[] = $property . ':' . $color;
				if ( 'textColor' === $key ) {
					$rules[] = '--ff-input-text-color:' . $color;
				}
			}
		}

		$length_map = [
			'width'       => [ 'width' ],
			'borderRadius' => [ 'border-radius' ],
			'paddingX'     => [ 'padding-left', 'padding-right' ],
			'paddingY'     => [ 'padding-top', 'padding-bottom' ],
			'paddingTop'   => [ 'padding-top' ],
			'paddingRight' => [ 'padding-right' ],
			'paddingBottom' => [ 'padding-bottom' ],
			'paddingLeft'  => [ 'padding-left' ],
			'fontSize'     => [ 'font-size' ],
		];
		foreach ( $length_map as $key => $properties ) {
			$length = self::css_length( $style[ $key ] ?? '' );
			if ( ! $length ) {
				continue;
			}
			foreach ( $properties as $property ) {
				$rules[] = $property . ':' . $length;
			}
		}

		$border = is_array( $style['border'] ?? null ) ? $style['border'] : [];
		if ( isset( $border['top'] ) || isset( $border['right'] ) || isset( $border['bottom'] ) || isset( $border['left'] ) ) {
			foreach ( [ 'top', 'right', 'bottom', 'left' ] as $side ) {
				$side_border = is_array( $border[ $side ] ?? null ) ? $border[ $side ] : [];
				self::append_border_rules( $rules, $side_border, 'border-' . $side );
			}
		} else {
			$flat_border = $border ?: [
				'color' => $style['borderColor'] ?? '',
				'style' => $style['borderStyle'] ?? '',
				'width' => $style['borderWidth'] ?? '',
			];
			self::append_border_rules( $rules, $flat_border, 'border' );
		}

		$line_height = self::css_line_height( $style['lineHeight'] ?? '' );
		if ( $line_height ) {
			$rules[] = 'line-height:' . $line_height;
		}

		return $rules ? ' style="' . esc_attr( implode( ';', $rules ) ) . '"' : '';
	}

	private static function append_border_rules( array &$rules, array $border, string $prefix ): void {
		$color = self::css_color( $border['color'] ?? '' );
		if ( $color ) {
			$rules[] = $prefix . '-color:' . $color;
		}

		$width = self::css_length( $border['width'] ?? '' );
		if ( $width ) {
			$rules[] = $prefix . '-width:' . $width;
		}

		$style = (string) ( $border['style'] ?? '' );
		if ( in_array( $style, [ 'solid', 'dashed', 'dotted', 'double', 'none' ], true ) ) {
			$rules[] = $prefix . '-style:' . $style;
		}
	}

	/**
	 * Common attribute string used on `<input>`, `<select>`, `<textarea>`:
	 *  - required + aria-required when the user marked the field required
	 *  - aria-describedby pointing at the help text + error slot
	 *  - aria-invalid="false" for a clean initial state (JS flips on
	 *    validation error)
	 */
	private static function input_aria_attrs( string $field_id, bool $required, bool $has_help, bool $has_inner_content = false ): string {
		$req_attr     = $required ? 'required aria-required="true"' : '';
		$describedby  = trim( ( $has_help ? "ff-desc-{$field_id} " : '' ) . "ff-error-{$field_id}" );
		$desc_attr    = $describedby
			? sprintf( ' aria-describedby="%s"', esc_attr( $describedby ) )
			: '';
		$label_attr = $has_inner_content
			? sprintf( ' aria-labelledby="ff-content-%s"', esc_attr( $field_id ) )
			: '';
		return $req_attr . $desc_attr . $label_attr . ' aria-invalid="false"';
	}

	private static function field_id( array $attrs ): string {
		return sanitize_html_class( $attrs['fieldId'] ?? '' );
	}

	/* ---------------------------------------------------------------
	 * Per-block renderers
	 * ------------------------------------------------------------- */

	public static function render_text( array $attrs, string $content = '' ): string {
		return self::render_simple_input( $attrs, 'text', '', $content );
	}

	public static function render_email( array $attrs, string $content = '' ): string {
		return self::render_simple_input( $attrs, 'email', 'email', $content );
	}

	public static function render_number( array $attrs, string $content = '' ): string {
		$id       = self::field_id( $attrs );
		$required = ! empty( $attrs['required'] );
		$help     = (string) ( $attrs['help'] ?? '' );
		$has_inner_content = self::has_inner_content( $content );

		$range = '';
		if ( isset( $attrs['min'] ) )  $range .= ' min="'  . esc_attr( $attrs['min']  ) . '"';
		if ( isset( $attrs['max'] ) )  $range .= ' max="'  . esc_attr( $attrs['max']  ) . '"';
		if ( isset( $attrs['step'] ) ) $range .= ' step="' . esc_attr( $attrs['step'] ) . '"';

		return sprintf(
			'<div %1$s>%2$s%3$s<input type="number" name="%4$s" id="ff-field-%4$s" class="ff-form__input" value="%5$s" placeholder="%6$s"%7$s%8$s %9$s />%10$s</div>',
			self::wrapper_attrs( $id, $required ? [ 'is-required' ] : [] ),
			self::field_content_html( $id, $attrs, $content, $required ),
			'',
			esc_attr( $id ),
			esc_attr( $attrs['defaultValue'] ?? '' ),
			esc_attr( $attrs['placeholder']  ?? '' ),
			$range, // phpcs:ignore WordPress.Security.EscapeOutput
			self::control_style_attr( $attrs ), // phpcs:ignore WordPress.Security.EscapeOutput
			self::input_aria_attrs( $id, $required, ! $has_inner_content && '' !== $help, $has_inner_content ), // phpcs:ignore WordPress.Security.EscapeOutput
			self::error_slot( $id )
		);
	}

	private static function render_simple_input( array $attrs, string $type, string $autocomplete = '', string $content = '' ): string {
		$id       = self::field_id( $attrs );
		$required = ! empty( $attrs['required'] );
		$help     = (string) ( $attrs['help'] ?? '' );
		$auto     = $autocomplete ? sprintf( ' autocomplete="%s"', esc_attr( $autocomplete ) ) : '';
		$has_inner_content = self::has_inner_content( $content );

		return sprintf(
			'<div %1$s>%2$s%3$s<input type="%4$s" name="%5$s" id="ff-field-%5$s" class="ff-form__input" value="%6$s" placeholder="%7$s"%8$s%9$s %10$s />%11$s</div>',
			self::wrapper_attrs( $id, $required ? [ 'is-required' ] : [] ),
			self::field_content_html( $id, $attrs, $content, $required ),
			'',
			esc_attr( $type ),
			esc_attr( $id ),
			esc_attr( $attrs['defaultValue'] ?? '' ),
			esc_attr( $attrs['placeholder']  ?? '' ),
			$auto, // phpcs:ignore WordPress.Security.EscapeOutput
			self::control_style_attr( $attrs ), // phpcs:ignore WordPress.Security.EscapeOutput
			self::input_aria_attrs( $id, $required, ! $has_inner_content && '' !== $help, $has_inner_content ), // phpcs:ignore WordPress.Security.EscapeOutput
			self::error_slot( $id )
		);
	}

	public static function render_textarea( array $attrs, string $content = '' ): string {
		$id       = self::field_id( $attrs );
		$required = ! empty( $attrs['required'] );
		$help     = (string) ( $attrs['help'] ?? '' );
		$rows     = (int) ( $attrs['rows'] ?? 4 );
		$has_inner_content = self::has_inner_content( $content );

		return sprintf(
			'<div %1$s>%2$s%3$s<textarea name="%4$s" id="ff-field-%4$s" class="ff-form__textarea" rows="%5$d" placeholder="%6$s"%7$s %8$s>%9$s</textarea>%10$s</div>',
			self::wrapper_attrs( $id, $required ? [ 'is-required' ] : [] ),
			self::field_content_html( $id, $attrs, $content, $required ),
			'',
			esc_attr( $id ),
			$rows,
			esc_attr( $attrs['placeholder'] ?? '' ),
			self::control_style_attr( $attrs ), // phpcs:ignore WordPress.Security.EscapeOutput
			self::input_aria_attrs( $id, $required, ! $has_inner_content && '' !== $help, $has_inner_content ), // phpcs:ignore WordPress.Security.EscapeOutput
			esc_textarea( $attrs['defaultValue'] ?? '' ),
			self::error_slot( $id )
		);
	}

	public static function render_select( array $attrs, string $content = '' ): string {
		$id       = self::field_id( $attrs );
		$required = ! empty( $attrs['required'] );
		$help     = (string) ( $attrs['help'] ?? '' );
		$options  = is_array( $attrs['options'] ?? null ) ? $attrs['options'] : [];
		$selected = (string) ( $attrs['defaultValue'] ?? '' );
		$has_inner_content = self::has_inner_content( $content );

		$opts_html = '<option value="">' . esc_html__( 'Select…', 'flowforms' ) . '</option>';
		foreach ( $options as $opt ) {
			$val = (string) ( $opt['value'] ?? '' );
			$lbl = (string) ( $opt['label'] ?? $val );
			$opts_html .= sprintf(
				'<option value="%s"%s>%s</option>',
				esc_attr( $val ),
				selected( $selected, $val, false ),
				esc_html( $lbl )
			);
		}

		return sprintf(
			'<div %1$s>%2$s%3$s<select name="%4$s" id="ff-field-%4$s" class="ff-form__select"%5$s %6$s>%7$s</select>%8$s</div>',
			self::wrapper_attrs( $id, $required ? [ 'is-required' ] : [] ),
			self::field_content_html( $id, $attrs, $content, $required ),
			'',
			esc_attr( $id ),
			self::control_style_attr( $attrs ), // phpcs:ignore WordPress.Security.EscapeOutput
			self::input_aria_attrs( $id, $required, ! $has_inner_content && '' !== $help, $has_inner_content ), // phpcs:ignore WordPress.Security.EscapeOutput
			$opts_html, // phpcs:ignore WordPress.Security.EscapeOutput
			self::error_slot( $id )
		);
	}

	public static function render_radio( array $attrs, string $content = '' ): string {
		return self::render_choice_group( $attrs, 'radio', $content );
	}

	public static function render_checkbox( array $attrs, string $content = '' ): string {
		return self::render_choice_group( $attrs, 'checkbox', $content );
	}

	private static function render_choice_group( array $attrs, string $type, string $content = '' ): string {
		$id       = self::field_id( $attrs );
		$required = ! empty( $attrs['required'] );
		$help     = (string) ( $attrs['help'] ?? '' );
		$options  = is_array( $attrs['options'] ?? null ) ? $attrs['options'] : [];
		$name     = 'checkbox' === $type ? $id . '[]' : $id;
		$has_inner_content = self::has_inner_content( $content );

		$choices = '';
		foreach ( $options as $i => $opt ) {
			$val      = (string) ( $opt['value'] ?? '' );
			$lbl      = (string) ( $opt['label'] ?? $val );
			$choice_id = sprintf( 'ff-field-%s-%d', esc_attr( $id ), (int) $i );
			$first_required = ( 'radio' === $type && 0 === (int) $i && $required ) ? 'required aria-required="true"' : '';
			$choices .= sprintf(
				'<label class="ff-form__choice" for="%1$s"><input type="%2$s" id="%1$s" name="%3$s" value="%4$s" %5$s/><span>%6$s</span></label>',
				$choice_id,
				esc_attr( $type ),
				esc_attr( $name ),
				esc_attr( $val ),
				$first_required, // phpcs:ignore WordPress.Security.EscapeOutput
				esc_html( $lbl )
			);
		}

		$fieldset_attrs = trim(
			( $required ? 'aria-required="true"' : '' )
			. ( $has_inner_content ? sprintf( ' aria-labelledby="ff-content-%s"', esc_attr( $id ) ) : '' )
		);

		return sprintf(
			'<div %1$s>%2$s<fieldset class="ff-form__fieldset" %3$s><legend class="%4$s">%5$s%6$s</legend>%7$s<div class="ff-form__choices"%8$s>%9$s</div>%10$s</fieldset></div>',
			self::wrapper_attrs( $id, $required ? [ 'is-required' ] : [] ),
			$has_inner_content ? self::field_content_html( $id, $attrs, $content, $required ) : '',
			$fieldset_attrs, // phpcs:ignore WordPress.Security.EscapeOutput
			$has_inner_content ? 'screen-reader-text' : 'ff-form__label',
			esc_html( (string) ( $attrs['label'] ?? '' ) ),
			$required
				? ' <span class="ff-form__required" aria-hidden="true">*</span><span class="screen-reader-text">' . esc_html__( '(required)', 'flowforms' ) . '</span>'
				: '',
			$has_inner_content ? '' : self::help_html( $id, $help ),
			self::control_style_attr( $attrs ), // phpcs:ignore WordPress.Security.EscapeOutput
			$choices, // phpcs:ignore WordPress.Security.EscapeOutput
			self::error_slot( $id )
		);
	}

	/**
	 * Submit block — the wrapper is empty; the inner `core/button`
	 * carries all the visual styling (and renders itself via Gutenberg).
	 * `$content` here is the already-rendered inner block HTML.
	 *
	 * We surface that inside a `.ff-form__pagination` div so the existing
	 * frontend CSS / JS that targets `.ff-form__submit` still works for
	 * pagination + submit-disabled-while-submitting.
	 */
	public static function render_submit( array $attrs, string $content ): string {
		if ( ! self::has_inner_content( $content ) ) {
			$content = '<div class="wp-block-button"><button class="wp-block-button__link wp-element-button">' . esc_html__( 'Submit', 'flowforms' ) . '</button></div>';
		}

		// Force `type="submit"` and add the `ff-form__submit` class to
		// every <button>/<a> inside, so the user can't accidentally
		// leave the form un-submittable. Also adds the
		// `data-wp-bind--disabled` Interactivity directive so the
		// button greys out while the request is in flight.
		$content = preg_replace_callback(
			'#<(button|a)\b([^>]*)>#i',
			static function ( $m ) {
				$attrs_str = $m[2];
				// Ensure class contains ff-form__submit + wp-element-button.
				if ( preg_match( '/\bclass="([^"]*)"/i', $attrs_str, $cm ) ) {
					$classes = trim( $cm[1] . ' ff-form__submit' );
					$attrs_str = preg_replace( '/\bclass="[^"]*"/i', 'class="' . esc_attr( $classes ) . '"', $attrs_str );
				} else {
					$attrs_str .= ' class="ff-form__submit"';
				}
				if ( strtolower( $m[1] ) === 'button' ) {
					// Force type=submit; replace existing type if any.
					if ( preg_match( '/\btype="[^"]*"/i', $attrs_str ) ) {
						$attrs_str = preg_replace( '/\btype="[^"]*"/i', 'type="submit"', $attrs_str );
					} else {
						$attrs_str .= ' type="submit"';
					}
				}
				// Interactivity binding — disables while submitting.
				if ( ! str_contains( $attrs_str, 'data-wp-bind--disabled' ) ) {
					$attrs_str .= ' data-wp-bind--disabled="context.isSubmitting"';
				}
				return '<' . $m[1] . $attrs_str . '>';
			},
			$content
		);

		$wrapper_attrs = get_block_wrapper_attributes( [ 'class' => 'ff-form__pagination' ] );
		return sprintf(
			'<div %1$s><div class="ff-form__footer">%2$s</div></div>',
			$wrapper_attrs, // phpcs:ignore WordPress.Security.EscapeOutput
			$content        // phpcs:ignore WordPress.Security.EscapeOutput — sanitised above
		);
	}
}
