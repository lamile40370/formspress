<?php

namespace FlowForms\Modules\Templates\Services;

/**
 * PHP-side helpers for emitting Gutenberg block-comment markup from
 * templates.
 *
 * Validation-correct output
 * -------------------------
 * Gutenberg's parser validates every static block by re-running its
 * `save()` and comparing the output to the saved inner HTML. For
 * container blocks (`core/group`, `core/cover`, `core/columns`,
 * `core/media-text`) we therefore HAVE to ship the exact wrapper
 * the block would render — same classes, same inline-style order.
 *
 * Class order (per `useBlockProps.save()` in WP 6.x):
 *   - base block class (`wp-block-group`, `wp-block-columns`, …)
 *   - `has-text-color`     when `style.color.text` set
 *   - `has-background`     when `style.color.background` set
 *   - `has-border-color`   when `style.border.color` set
 *
 * Inline-style order (the WP style-engine emits properties in this
 * exact sequence, which is what `save()` produces):
 *   1. color.text          → `color:`
 *   2. color.background    → `background-color:`
 *   3. border.color        → `border-color:`
 *   4. border.style        → `border-style:`
 *   5. border.width        → `border-width:`
 *   6. border.radius       → `border-radius:`
 *   7. spacing.padding.{t,r,b,l}
 *   8. typography.*
 *
 * `layout` and `blockGap` are added at RUNTIME by Gutenberg's filter
 * system, NOT by save() — they don't appear in the saved HTML, only
 * the persisted attrs. So we leave them in attrs but don't emit them
 * in the wrapper string.
 *
 * Content blocks (heading, paragraph, button, image) use the same
 * approach — their save() output is stable, and we mirror it exactly.
 */
class TemplateBlocks {

	/**
	 * Build a class string + inline-style string from a style attrs
	 * dict in the precise order WP's style engine produces.
	 *
	 * @return array{0:string,1:string}  [ extra_classes_string, inline_style ]
	 */
	private static function class_and_style( array $style ): array {
		$classes = [];
		$styles  = [];

		// Color
		if ( ! empty( $style['color']['text'] ) ) {
			$classes[] = 'has-text-color';
			$styles[]  = 'color:' . $style['color']['text'];
		}
		if ( ! empty( $style['color']['background'] ) ) {
			$classes[] = 'has-background';
			$styles[]  = 'background-color:' . $style['color']['background'];
		}

		// Border
		if ( ! empty( $style['border']['color'] ) ) {
			$classes[] = 'has-border-color';
			$styles[]  = 'border-color:' . $style['border']['color'];
		}
		if ( ! empty( $style['border']['style'] ) ) {
			$styles[] = 'border-style:' . $style['border']['style'];
		}
		if ( ! empty( $style['border']['width'] ) ) {
			$styles[] = 'border-width:' . $style['border']['width'];
		}
		if ( ! empty( $style['border']['radius'] ) ) {
			$styles[] = 'border-radius:' . $style['border']['radius'];
		}

		// Spacing.padding (each side)
		if ( isset( $style['spacing']['padding'] ) && is_array( $style['spacing']['padding'] ) ) {
			$p = $style['spacing']['padding'];
			if ( ! empty( $p['top'] ) )    $styles[] = 'padding-top:' . $p['top'];
			if ( ! empty( $p['right'] ) )  $styles[] = 'padding-right:' . $p['right'];
			if ( ! empty( $p['bottom'] ) ) $styles[] = 'padding-bottom:' . $p['bottom'];
			if ( ! empty( $p['left'] ) )   $styles[] = 'padding-left:' . $p['left'];
		}

		// Typography
		if ( ! empty( $style['typography']['fontSize'] ) ) {
			$styles[] = 'font-size:' . $style['typography']['fontSize'];
		}
		if ( ! empty( $style['typography']['fontWeight'] ) ) {
			$styles[] = 'font-weight:' . $style['typography']['fontWeight'];
		}
		if ( ! empty( $style['typography']['lineHeight'] ) ) {
			$styles[] = 'line-height:' . $style['typography']['lineHeight'];
		}

		// Margin-bottom (typographic helpers use this)
		if ( isset( $style['spacing']['margin']['bottom'] ) && '' !== $style['spacing']['margin']['bottom'] ) {
			$styles[] = 'margin-bottom:' . $style['spacing']['margin']['bottom'];
		}

		return [ implode( ' ', $classes ), implode( ';', $styles ) ];
	}

	/* ---------------------------------------------------------------
	 * Container blocks — wrap children in proper save()-matching HTML.
	 * ------------------------------------------------------------- */

	public static function group( array $args ): string {
		$bg          = $args['bg']          ?? null;
		$fg          = $args['fg']          ?? null;
		$radius      = $args['radius']      ?? null;
		$padding     = $args['padding']     ?? null;
		$max_width   = $args['maxWidth']    ?? null;
		$border      = $args['border']      ?? null;
		$border_w    = $args['borderWidth'] ?? '1px';
		$inner       = (string) ( $args['inner'] ?? '' );

		$style = [];
		if ( $padding ) {
			$style['spacing'] = [
				'padding'  => [ 'top' => $padding, 'right' => $padding, 'bottom' => $padding, 'left' => $padding ],
				'blockGap' => '18px',
			];
		}
		$border_style = [];
		if ( $radius )   $border_style['radius'] = $radius;
		if ( $border )   $border_style['color']  = $border;
		if ( $border )   $border_style['width']  = $border_w;
		if ( ! empty( $border_style ) ) {
			$style['border'] = $border_style;
		}
		if ( $bg ) $style['color']['background'] = $bg;
		if ( $fg ) $style['color']['text']       = $fg;

		$attrs = [ 'tagName' => 'div' ];
		if ( $max_width ) {
			$attrs['layout'] = [ 'type' => 'constrained', 'contentSize' => $max_width ];
		}
		if ( ! empty( $style ) ) {
			$attrs['style'] = $style;
		}

		[ $extra_classes, $inline_style ] = self::class_and_style( $style );
		$class = trim( 'wp-block-group ' . $extra_classes );
		$wrapper_open = sprintf(
			'<div class="%s"%s>',
			esc_attr( $class ),
			$inline_style ? ' style="' . esc_attr( $inline_style ) . '"' : ''
		);

		return sprintf(
			"<!-- wp:group %s -->\n%s\n%s\n</div>\n<!-- /wp:group -->",
			wp_json_encode( $attrs ),
			$wrapper_open,
			$inner
		);
	}

	public static function cover( array $args ): string {
		$inner          = (string) ( $args['inner'] ?? '' );
		$image          = (string) ( $args['image'] ?? '' );
		$overlay        = (int)    ( $args['overlayOpacity'] ?? 60 );
		$overlay_color  = (string) ( $args['overlayColor'] ?? '#0f172a' );
		$min_height     = (int)    ( $args['minHeight'] ?? 480 );
		$max_width      = (string) ( $args['maxWidth'] ?? '560px' );
		$padding_y      = (string) ( $args['paddingY'] ?? '64px' );

		$attrs = [
			'dimRatio'           => $overlay,
			'customOverlayColor' => $overlay_color,
			'minHeight'          => $min_height,
			'minHeightUnit'      => 'px',
			'contentPosition'    => 'center center',
			'isDark'             => true,
			'layout'             => [ 'type' => 'constrained', 'contentSize' => $max_width ],
			'style'              => [
				'spacing' => [ 'padding' => [ 'top' => $padding_y, 'right' => '32px', 'bottom' => $padding_y, 'left' => '32px' ] ],
			],
		];
		if ( '' !== $image ) {
			$attrs['url'] = $image;
		}

		$min_style = sprintf( 'padding-top:%s;padding-right:32px;padding-bottom:%s;padding-left:32px;min-height:%dpx', $padding_y, $padding_y, $min_height );

		// `core/cover` save() includes a fixed structure: the cover root,
		// an aria-hidden overlay span with `has-background-dim-N`, an
		// optional `<img>` background, and an `__inner-container` for
		// the children. Matching this exactly is what lets the block
		// pass validation.
		$image_html = $image
			? sprintf( '<img class="wp-block-cover__image-background" alt="" src="%s" data-object-fit="cover"/>', esc_url( $image ) )
			: '';
		$overlay_html = sprintf(
			'<span aria-hidden="true" class="wp-block-cover__background has-background-dim-%d has-background-dim" style="background-color:%s"></span>',
			$overlay,
			esc_attr( $overlay_color )
		);

		return sprintf(
			'<!-- wp:cover %s -->
<div class="wp-block-cover is-light has-custom-content-position is-position-center-center" style="%s">%s%s<div class="wp-block-cover__inner-container">
%s
</div></div>
<!-- /wp:cover -->',
			wp_json_encode( $attrs ),
			esc_attr( $min_style ),
			$image_html,
			$overlay_html,
			$inner
		);
	}

	public static function columns( string $left_inner, string $right_inner, string $gap = '32px' ): string {
		$cols_attrs   = [ 'style' => [ 'spacing' => [ 'blockGap' => [ 'left' => $gap ] ] ] ];

		// `core/columns` save() emits a plain `<div class="wp-block-columns">`
		// wrapping the inner column blocks. No extra inline style for the
		// blockGap (that's a runtime layout class).
		$column_open  = '<div class="wp-block-column">';
		$column_close = '</div>';
		$inner_blocks_markup = sprintf(
			"<!-- wp:column -->\n%s\n%s\n%s\n<!-- /wp:column -->\n\n<!-- wp:column -->\n%s\n%s\n%s\n<!-- /wp:column -->",
			$column_open, $left_inner,  $column_close,
			$column_open, $right_inner, $column_close
		);

		return sprintf(
			"<!-- wp:columns %s -->\n<div class=\"wp-block-columns\">\n%s\n</div>\n<!-- /wp:columns -->",
			wp_json_encode( $cols_attrs ),
			$inner_blocks_markup
		);
	}

	/* ---------------------------------------------------------------
	 * Content blocks — already match save() exactly.
	 * ------------------------------------------------------------- */

	public static function heading( array $args ): string {
		$text          = (string) ( $args['text']          ?? '' );
		$level         = (int)    ( $args['level']         ?? 2 );
		$size          = (string) ( $args['size']          ?? '26px' );
		$weight        = (string) ( $args['weight']        ?? '700' );
		$align         = $args['align']         ?? null;
		$color         = $args['color']         ?? null;
		$margin_bottom = (string) ( $args['marginBottom'] ?? '4px' );

		$style = [
			'typography' => [ 'fontSize' => $size, 'fontWeight' => $weight, 'lineHeight' => '1.2' ],
			'spacing'    => [ 'margin' => [ 'bottom' => $margin_bottom ] ],
		];
		if ( $color ) $style['color'] = [ 'text' => $color ];

		$attrs = [ 'level' => $level, 'style' => $style ];
		if ( $align ) $attrs['textAlign'] = $align;

		[ $extra_classes, $inline_style ] = self::class_and_style( $style );
		$classes = trim( implode( ' ', array_filter( [
			'wp-block-heading',
			$align ? 'has-text-align-' . $align : '',
			$extra_classes,
		] ) ) );

		$html = sprintf(
			'<h%d class="%s" style="%s">%s</h%d>',
			$level,
			esc_attr( $classes ),
			esc_attr( $inline_style ),
			esc_html( $text ),
			$level
		);

		return sprintf(
			"<!-- wp:heading %s -->\n%s\n<!-- /wp:heading -->",
			wp_json_encode( $attrs ),
			$html
		);
	}

	public static function description( array $args ): string {
		$text          = (string) ( $args['text']          ?? '' );
		$color         = (string) ( $args['color']         ?? '#6b7280' );
		$size          = (string) ( $args['size']          ?? '14px' );
		$align         = $args['align']         ?? null;
		$margin_bottom = (string) ( $args['marginBottom'] ?? '16px' );

		$style = [
			'color'      => [ 'text' => $color ],
			'typography' => [ 'fontSize' => $size, 'lineHeight' => '1.6' ],
			'spacing'    => [ 'margin' => [ 'bottom' => $margin_bottom ] ],
		];
		$attrs = [ 'style' => $style ];
		if ( $align ) $attrs['align'] = $align;

		[ $extra_classes, $inline_style ] = self::class_and_style( $style );
		$classes = trim( implode( ' ', array_filter( [
			$align ? 'has-text-align-' . $align : '',
			$extra_classes,
		] ) ) );

		$html = sprintf(
			'<p class="%s" style="%s">%s</p>',
			esc_attr( $classes ),
			esc_attr( $inline_style ),
			esc_html( $text )
		);

		return sprintf(
			"<!-- wp:paragraph %s -->\n%s\n<!-- /wp:paragraph -->",
			wp_json_encode( $attrs ),
			$html
		);
	}

	public static function image( string $url, string $alt = '', array $args = [] ): string {
		$radius = (string) ( $args['radius'] ?? '12px' );
		$align  = $args['align'] ?? null;
		$attrs  = [ 'sizeSlug' => 'large', 'style' => [ 'border' => [ 'radius' => $radius ] ] ];
		if ( $align ) $attrs['align'] = $align;

		$figure_class = 'wp-block-image' . ( $align ? ' align' . $align : '' ) . ' size-large has-custom-border is-style-default';
		$html = sprintf(
			'<figure class="%s"><img src="%s" alt="%s" style="border-radius:%s"/></figure>',
			esc_attr( $figure_class ),
			esc_url( $url ),
			esc_attr( $alt ),
			esc_attr( $radius )
		);
		return sprintf(
			"<!-- wp:image %s -->\n%s\n<!-- /wp:image -->",
			wp_json_encode( $attrs ),
			$html
		);
	}

	public static function submit_button( array $args = [] ): string {
		$text   = (string) ( $args['text'] ?? __( 'Submit', 'flowforms' ) );
		$bg     = (string) ( $args['bg']   ?? '#111827' );
		$fg     = (string) ( $args['fg']   ?? '#ffffff' );
		$radius = (string) ( $args['radius'] ?? '10px' );
		$py     = (string) ( $args['paddingY'] ?? '15px' );
		$px     = (string) ( $args['paddingX'] ?? '34px' );
		$full   = ! empty( $args['full'] );

		$btn_attrs = [
			'text'    => $text,
			'tagName' => 'button',
			'type'    => 'submit',
			'lock'    => [ 'move' => true ],
			'style'   => [
				'color'      => [ 'background' => $bg, 'text' => $fg ],
				'border'     => [ 'radius' => $radius ],
				'spacing'    => [ 'padding' => [ 'top' => $py, 'right' => $px, 'bottom' => $py, 'left' => $px ] ],
				'typography' => [ 'fontSize' => '15px', 'fontWeight' => '600' ],
			],
		];
		if ( $full ) {
			$btn_attrs['width'] = 100;
		}

		// `core/button` save() emits (WP 6.x format):
		//   <div class="wp-block-button{ has-custom-width wp-block-button__width-100 }">
		//     <button class="wp-block-button__link has-text-color
		//                    has-background has-custom-font-size
		//                    wp-element-button"
		//             type="submit"
		//             style="border-radius:R;color:T;background-color:B;
		//                    padding-top:..;padding-right:..;
		//                    padding-bottom:..;padding-left:..;
		//                    font-size:..;font-weight:..">
		//       <span>TEXT</span>
		//     </button>
		//   </div>
		//
		// Two things from earlier emissions that DID NOT match:
		//   - The text was NOT wrapped in a `<span>` — RichText.Content
		//     wraps it since WP 5.x.
		//   - The `has-custom-font-size` class was missing — added
		//     automatically when typography.fontSize is set.
		//
		// Also note the inline-style order for buttons is BORDER → COLOR
		// → SPACING (different from group/columns which is COLOR first).
		$inline_style = sprintf(
			'border-radius:%s;color:%s;background-color:%s;padding-top:%s;padding-right:%s;padding-bottom:%s;padding-left:%s;font-size:15px;font-weight:600',
			$radius,
			$fg,
			$bg,
			$py,
			$px,
			$py,
			$px
		);

		$btn_inner_html = sprintf(
			'<div class="wp-block-button%s"><button class="wp-block-button__link has-text-color has-background has-custom-font-size wp-element-button" type="submit" style="%s"><span>%s</span></button></div>',
			$full ? ' has-custom-width wp-block-button__width-100' : '',
			esc_attr( $inline_style ),
			esc_html( $text )
		);

		$btn_block = sprintf(
			"<!-- wp:button %s -->\n%s\n<!-- /wp:button -->",
			wp_json_encode( $btn_attrs ),
			$btn_inner_html
		);

		// formspress/field-submit is a DYNAMIC block — `save: () => null`
		// means its blockSave is '', and Gutenberg's validator strictly
		// compares to originalContent. We emit ZERO whitespace between
		// the wrapper's open comment and the inner button's open comment
		// (and same on the closing side) so originalContent stays empty.
		return '<!-- wp:formspress/field-submit -->' . $btn_block . '<!-- /wp:formspress/field-submit -->';
	}

	/* ---------------------------------------------------------------
	 * Field blocks — custom controls with native inner content. The
	 * legacy attrs still store the submission key metadata, while the
	 * visible label/help text are real Gutenberg paragraph blocks.
	 * ------------------------------------------------------------- */

	private static function field_inner_content( array $a ): string {
		$blocks = [];
		$label  = trim( (string) ( $a['label'] ?? '' ) );
		$help   = trim( (string) ( $a['help'] ?? '' ) );

		if ( '' !== $label ) {
			$blocks[] = sprintf(
				"<!-- wp:paragraph {\"className\":\"ff-field-label\"} -->\n<p class=\"ff-field-label\">%s</p>\n<!-- /wp:paragraph -->",
				esc_html( $label )
			);
		}

		if ( '' !== $help ) {
			$blocks[] = sprintf(
				"<!-- wp:paragraph {\"className\":\"ff-field-help\",\"fontSize\":\"small\"} -->\n<p class=\"ff-field-help has-small-font-size\">%s</p>\n<!-- /wp:paragraph -->",
				esc_html( $help )
			);
		}

		return implode( "\n", $blocks );
	}

	private static function field_block( string $name, array $a ): string {
		$a = self::with_default_input_style( $a );
		$content = self::field_inner_content( $a );

		if ( '' === $content ) {
			return '<!-- wp:' . $name . ' ' . wp_json_encode( $a ) . ' /-->';
		}

		return sprintf(
			"<!-- wp:%1\$s %2\$s -->\n%3\$s\n<!-- /wp:%1\$s -->",
			$name,
			wp_json_encode( $a ),
			$content
		);
	}

	public static function field_text( array $a ): string     { return self::field_block( 'formspress/field-text', $a ); }
	public static function field_email( array $a ): string    { return self::field_block( 'formspress/field-email', $a ); }
	public static function field_textarea( array $a ): string { return self::field_block( 'formspress/field-textarea', $a ); }
	public static function field_number( array $a ): string   { return self::field_block( 'formspress/field-number', $a ); }
	public static function field_select( array $a ): string   { return self::field_block( 'formspress/field-select', $a ); }
	public static function field_radio( array $a ): string    { return self::field_block( 'formspress/field-radio', $a ); }
	public static function field_checkbox( array $a ): string { return self::field_block( 'formspress/field-checkbox', $a ); }

	private static function with_default_input_style( array $attrs ): array {
		$default = [
			'backgroundColor' => '#ffffff',
			'textColor'       => '#111827',
			'borderRadius'    => '10px',
			'paddingY'        => '12px',
			'paddingX'        => '14px',
			'fontSize'        => '15px',
			'lineHeight'      => '1.45',
			'border'          => [
				'color' => '#d1d5db',
				'style' => 'solid',
				'width' => '1px',
			],
		];

		$current = is_array( $attrs['inputStyle'] ?? null ) ? $attrs['inputStyle'] : [];
		$attrs['inputStyle'] = array_replace_recursive( $default, $current );

		return $attrs;
	}

	/**
	 * placehold.co URL builder.
	 */
	public static function placeholder( string $size, string $bg = '0f172a', string $fg = 'ffffff', string $text = '' ): string {
		return sprintf(
			'https://placehold.co/%s/%s/%s/png?text=%s',
			$size,
			$bg,
			$fg,
			rawurlencode( '' !== $text ? $text : ' ' )
		);
	}
}
