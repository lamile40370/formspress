<?php

namespace FlowForms\Modules\Blocks;

use FlowForms\Extensibility\FieldTypes\FieldTypeRegistry;
use FlowForms\Extensibility\SpamProviders\SpamProviderRegistry;
use FlowForms\Modules\Forms\Services\FieldsParser;
use FlowForms\Plugin;

class FormRenderer {

	/**
	 * Load a form row from `ff_forms` and normalise it.
	 *
	 * The `fields` column holds either:
	 *   - block markup (saved by the Gutenberg-iso builder), or
	 *   - a JSON-encoded schema array (legacy custom builder).
	 *
	 * `FieldsParser::to_schema()` detects and converts. The returned
	 * shape is always the schema array everyone downstream expects.
	 */
	private static function load_form_row( int $form_id, string $expected_type = 'any', bool $active_only = true ): ?array {
		global $wpdb;
		$args       = [ $form_id ];
		$where      = '';

		if ( $active_only ) {
			$where .= " AND status = 'active'";
		}

		if ( in_array( $expected_type, [ 'flow', 'standard' ], true ) ) {
			$where .= ' AND type = %s';
			$args[] = $expected_type;
		}

		$row = $wpdb->get_row(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->prepare( "SELECT * FROM {$wpdb->prefix}ff_forms WHERE id = %d" . $where, $args ),
			ARRAY_A
		);
		if ( ! $row ) {
			return null;
		}

		// Preserve the raw `fields` column for the markup render path —
		// when the form was authored in the Gutenberg-iso standard
		// builder we re-emit it via `do_blocks()` so the user's parent
		// `core/group`, headings, columns and custom-styled button all
		// reach the page intact (instead of being flattened to schema).
		$raw_fields           = (string) ( $row['fields'] ?? '' );
		$row['fields_markup'] = $raw_fields;
		$row['is_markup']     = FieldsParser::is_markup( $raw_fields );

		// Schema view is still computed — needed for compact field
		// metadata used by the front-end runtime (conditional logic,
		// pagination split), regardless of which render path is taken.
		$row['fields']   = FieldsParser::to_schema( $raw_fields );
		$row['settings'] = json_decode( $row['settings'] ?? '{}', true ) ?: [];
		$row['variants'] = json_decode( $row['variants'] ?? '[]', true ) ?: [];
		return $row;
	}

	private static function field_types(): ?FieldTypeRegistry {
		try {
			$c = Plugin::instance()->container();
			return $c->has( FieldTypeRegistry::class ) ? $c->get( FieldTypeRegistry::class ) : null;
		} catch ( \Throwable $e ) {
			return null;
		}
	}

	private static function spam_providers(): ?SpamProviderRegistry {
		try {
			$c = Plugin::instance()->container();
			return $c->has( SpamProviderRegistry::class ) ? $c->get( SpamProviderRegistry::class ) : null;
		} catch ( \Throwable $e ) {
			return null;
		}
	}

	private static function spam_widget_html(): string {
		$registry = self::spam_providers();
		if ( ! $registry ) {
			return '';
		}
		$provider = $registry->get_active();
		if ( ! $provider ) {
			return '';
		}
		$config = $registry->get_active_config();

		/* Enqueue provider's frontend assets. */
		$assets = $provider->get_frontend_assets( $config );
		foreach ( $assets['scripts'] ?? [] as $i => $url ) {
			wp_enqueue_script( 'ff-spam-' . $provider->get_id() . '-' . $i, $url, [], null, true );
		}
		foreach ( $assets['styles'] ?? [] as $i => $url ) {
			wp_enqueue_style( 'ff-spam-' . $provider->get_id() . '-' . $i, $url, [], null );
		}

		return '<div class="ff-form__spam">' . $provider->render_widget( $config ) . '</div>';
	}

	public static function spam_data_attrs(): string {
		$registry = self::spam_providers();
		if ( ! $registry ) {
			return '';
		}
		$provider = $registry->get_active();
		if ( ! $provider ) {
			return '';
		}
		$config   = $registry->get_active_config();
		$site_key = (string) ( $config['site_key'] ?? '' );
		return ' data-spam-provider="' . esc_attr( $provider->get_id() ) . '"'
			. ' data-spam-site-key="' . esc_attr( $site_key ) . '"'
			. ' data-spam-token-field="' . esc_attr( $provider->get_token_field_name() ) . '"';
	}

	/**
	 * Block render entry point — uses Interactivity API directives.
	 * Called from blocks/form/render.php.
	 */
	public static function render_form_block( array $attributes, string $content, \WP_Block $block ): string {
		return self::render_standard_form( $attributes, true );
	}

	/**
	 * Flow form block render entry point. Flow forms keep the legacy
	 * imperative runtime — only the standard form moved to Interactivity API.
	 */
	public static function render_flow_form_block( array $attributes, string $content, \WP_Block $block ): string {
		return self::render_flow_form_markup( $attributes, true );
	}

	/**
	 * Backwards-compat shim — preserved for any legacy callers that may
	 * still target `FormRenderer::render_form` directly (e.g. third-party
	 * `register_block_type` overrides). New block.json registration goes
	 * through render_form_block().
	 */
	public static function render_form( array $attributes, string $content, \WP_Block $block ): string {
		return self::render_standard_form( $attributes, true );
	}

	/**
	 * Internal — renders a standard form. `$with_block_wrapper` controls
	 * whether `get_block_wrapper_attributes()` is emitted (only relevant
	 * inside a real block render context).
	 */
	private static function render_standard_form( array $attributes, bool $with_block_wrapper ): string {
		$form_id = (int) ( $attributes['formId'] ?? 0 );

		if ( ! $form_id ) {
			return '';
		}

		$form = self::load_form_row( $form_id, 'standard' );
		if ( ! $form ) {
			return '';
		}

		$form = apply_filters( 'flowforms_get_form_for_render', $form );

		self::enqueue_frontend_assets();

		$std_style = self::build_standard_style( $form['settings']['style'] ?? [] );

		/* Interactivity API state — one context per form instance. */
		$ctx = wp_json_encode( [
			'formId'       => $form_id,
			'isSubmitting' => false,
			'errors'       => (object) [],
			'message'      => '',
			'messageType'  => '',
			'sourceUrl'    => get_permalink() ?: '',
		] );

		$wrapper_attrs = $with_block_wrapper
			? get_block_wrapper_attributes( [
				'class'                  => 'ff-form-block-wrapper',
				'data-wp-interactive'    => 'formspress',
				'data-wp-context'        => $ctx,
			] )
			: sprintf(
				'class="ff-form-shortcode-wrapper" data-wp-interactive="formspress" data-wp-context=\'%s\'',
				esc_attr( $ctx )
			);

		ob_start();
		?>
		<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
			<form
				class="ff-form ff-form--standard"
				method="post"
				id="ff-form-<?php echo esc_attr( $form_id ); ?>"
				data-form-id="<?php echo esc_attr( $form_id ); ?>"
				data-type="standard"
				<?php if ( ! empty( $form['variant_id'] ) ) : ?>data-variant-id="<?php echo esc_attr( $form['variant_id'] ); ?>"<?php endif; ?>
				novalidate
				data-wp-on--submit="actions.submit"
				data-wp-class--is-submitting="context.isSubmitting"
				<?php if ( $with_block_wrapper && function_exists( 'wp_interactivity_state' ) ) : ?>data-ff-interactivity-submit="1"<?php endif; ?>
				<?php echo self::spam_data_attrs(); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				<?php if ( $std_style ) : ?>style="<?php echo esc_attr( $std_style ); ?>"<?php endif; ?>
			>
				<?php if ( ! empty( $attributes['displayTitle'] ) ) : ?>
					<h2 class="ff-form__title"><?php echo esc_html( $form['title'] ); ?></h2>
				<?php endif; ?>

				<?php if ( ! empty( $attributes['displayDescription'] ) && $form['description'] ) : ?>
					<p class="ff-form__description"><?php echo esc_html( $form['description'] ); ?></p>
				<?php endif; ?>

				<?php
				// Choose the render path. Forms authored in the
				// Gutenberg-iso standard builder are stored as block
				// markup — pipe them through `do_blocks()` so the
				// user's parent `core/group` (background, padding,
				// border, layout) plus any headings / columns / image
				// blocks they added reach the page natively, with our
				// `formspress/field-*` blocks contributing their input
				// HTML through the server-side render callbacks
				// registered in `StandardFieldsRenderer`.
				//
				// Legacy schema-only forms keep the old paginated
				// per-field renderer.
				$markup_total_pages = 1;
				if ( ! empty( $form['is_markup'] ) && ! empty( $form['fields_markup'] ) ) {
					$markup_total_pages = self::render_paged_markup( $form['fields_markup'], $form['settings'] );
				} else {
					self::render_paged_fields( $form['fields'], $form['settings'] );
				}
				?>

				<div class="ff-form__honeypot" aria-hidden="true">
					<label for="ff_hp_<?php echo esc_attr( $form_id ); ?>">Leave this field empty</label>
					<input type="text" name="_ff_hp" id="ff_hp_<?php echo esc_attr( $form_id ); ?>" tabindex="-1" autocomplete="off" />
				</div>

				<?php echo self::spam_widget_html(); // phpcs:ignore WordPress.Security.EscapeOutput ?>

				<input type="hidden" name="_source_url" value="<?php echo esc_url( get_permalink() ); ?>" />
				<input type="hidden" name="_ff_current_page" value="0" />

				<?php
				// Markup-rendered forms already contain their own
				// submit button (`formspress/field-submit` wrapping a
				// `core/button`). Only legacy schema forms still need
				// the auto-generated pagination + submit footer.
				if ( empty( $form['is_markup'] ) ) {
					self::render_pagination_bar( $form['fields'], $form['settings'] );
				} elseif ( $markup_total_pages > 1 ) {
					self::render_markup_pagination_bar( $markup_total_pages, $form['settings'] );
				}
				?>

				<div
					class="ff-form__messages"
					aria-live="polite"
					data-wp-class--ff-form__messages--success="state.isSuccess"
					data-wp-class--ff-form__messages--error="state.isError"
					data-wp-text="context.message"
				></div>
			</form>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Backwards-compat shim — preserved for legacy callers.
	 */
	public static function render_flow_form( array $attributes, string $content, \WP_Block $block ): string {
		return self::render_flow_form_markup( $attributes, true );
	}

	private static function render_flow_form_markup( array $attributes, bool $with_block_wrapper ): string {
		$form_id = (int) ( $attributes['formId'] ?? 0 );

		if ( ! $form_id ) {
			return '';
		}

		$form = self::load_form_row( $form_id, 'flow' );
		if ( ! $form ) {
			return '';
		}

		/**
		 * Filter the form data right before it's rendered on the front end.
		 * Compat providers (WPML / Polylang) translate user-facing strings here.
		 *
		 * @param array<string, mixed> $form Form row + decoded JSON fields/settings.
		 */
		$form = apply_filters( 'flowforms_get_form_for_render', $form );

		self::enqueue_frontend_assets();

		$wrapper_attrs = $with_block_wrapper
			? get_block_wrapper_attributes( [ 'class' => 'ff-flow-form-block-wrapper' ] )
			: 'class="ff-flow-form-shortcode-wrapper"';
		$settings      = $form['settings'];

		/* Build inline theme CSS custom properties */
		$theme       = $settings['theme'] ?? [];
		$theme_style = self::build_theme_style( $theme );

		ob_start();
		?>
		<div <?php echo $wrapper_attrs; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
			<div
				class="ff-form ff-form--flow"
				id="ff-form-<?php echo esc_attr( $form_id ); ?>"
				data-form-id="<?php echo esc_attr( $form_id ); ?>"
				data-form-title="<?php echo esc_attr( $form['title'] ); ?>"
				data-type="flow"
				<?php if ( ! empty( $form['variant_id'] ) ) : ?>data-variant-id="<?php echo esc_attr( $form['variant_id'] ); ?>"<?php endif; ?>
				data-fields="<?php echo esc_attr( wp_json_encode( $form['fields'] ) ); ?>"
				data-settings="<?php echo esc_attr( wp_json_encode( $settings ) ); ?>"
				<?php if ( $theme_style ) : ?>style="<?php echo esc_attr( $theme_style ); ?>"<?php endif; ?>
			></div>
		</div>
		<?php
		return ob_get_clean();
	}

	private static function render_fields( array $fields, array $settings ): void {
		foreach ( $fields as $field ) {
			self::render_field( $field );
		}
	}

	/**
	 * Render fields split across pages by `page_break` boundaries. Each page is
	 * wrapped in a <fieldset class="ff-form__page" data-page-index="N" hidden>.
	 * First page is visible. If no page_break exists, a single page wraps all
	 * fields and pagination UI degenerates to a plain submit button.
	 *
	 * @param array<int,array<string,mixed>> $fields
	 * @param array<string,mixed>            $settings
	 */
	private static function render_paged_fields( array $fields, array $settings ): void {
		$pages       = self::split_pages( $fields );
		$total_pages = count( $pages );

		foreach ( $pages as $page_index => $page_fields ) {
			$is_first = ( 0 === $page_index );
			printf(
				'<fieldset class="ff-form__page" data-page-index="%d"%s>',
				(int) $page_index,
				$is_first ? '' : ' hidden'
			);
			foreach ( $page_fields as $field ) {
				self::render_field( $field );
			}
			echo '</fieldset>';
		}

		// Pages metadata for the frontend runtime.
		printf(
			'<input type="hidden" name="_ff_total_pages" value="%d" />',
			(int) $total_pages
		);
	}

	/**
	 * Render block-markup forms split by page-break blocks.
	 *
	 * @return int Number of rendered pages.
	 */
	private static function render_paged_markup( string $markup, array $settings ): int {
		$pages       = self::split_markup_pages( \parse_blocks( $markup ) );
		$total_pages = count( $pages );

		if ( $total_pages <= 1 ) {
			echo do_blocks( $markup ); // phpcs:ignore WordPress.Security.EscapeOutput
			return 1;
		}

		self::render_step_progress( $total_pages );

		foreach ( $pages as $page_index => $page_blocks ) {
			$is_first = ( 0 === $page_index );
			printf(
				'<fieldset class="ff-form__page" data-page-index="%d"%s>',
				(int) $page_index,
				$is_first ? '' : ' hidden'
			);
			echo do_blocks( serialize_blocks( $page_blocks ) ); // phpcs:ignore WordPress.Security.EscapeOutput
			echo '</fieldset>';
		}

		printf(
			'<input type="hidden" name="_ff_total_pages" value="%d" />',
			(int) $total_pages
		);

		return $total_pages;
	}

	/**
	 * Split top-level block markup at page-break boundaries.
	 *
	 * @param array<int,array<string,mixed>> $blocks
	 * @return array<int,array<int,array<string,mixed>>>
	 */
	private static function split_markup_pages( array $blocks ): array {
		$pages   = [ [] ];
		$current = 0;

		foreach ( $blocks as $block ) {
			foreach ( self::split_markup_block_segments( $block ) as $segment ) {
				if ( ! empty( $segment['break'] ) ) {
					$current++;
					$pages[ $current ] = [];
					continue;
				}

				if ( ! empty( $segment['block'] ) ) {
					$pages[ $current ][] = $segment['block'];
				}
			}
		}

		return array_values( array_filter( $pages, static fn( array $page ): bool => ! empty( $page ) ) ) ?: [ [] ];
	}

	/**
	 * Split one parsed block into page-sized block segments.
	 *
	 * @param array<string,mixed> $block
	 * @return array<int,array{block?:array<string,mixed>,break?:bool}>
	 */
	private static function split_markup_block_segments( array $block ): array {
		if ( 'formspress/field-page-break' === ( $block['blockName'] ?? '' ) ) {
			return [ [ 'break' => true ] ];
		}

		$inner_blocks = is_array( $block['innerBlocks'] ?? null ) ? $block['innerBlocks'] : [];
		if ( empty( $inner_blocks ) ) {
			return empty( $block['blockName'] ) ? [] : [ [ 'block' => $block ] ];
		}

		$segments = [];
		$current  = [];

		foreach ( $inner_blocks as $inner_block ) {
			foreach ( self::split_markup_block_segments( $inner_block ) as $inner_segment ) {
				if ( ! empty( $inner_segment['break'] ) ) {
					if ( ! empty( $current ) ) {
						$segments[] = [ 'block' => self::clone_block_with_inner_blocks( $block, $current ) ];
						$current    = [];
					}
					$segments[] = [ 'break' => true ];
					continue;
				}

				if ( ! empty( $inner_segment['block'] ) ) {
					$current[] = $inner_segment['block'];
				}
			}
		}

		if ( ! empty( $current ) ) {
			$segments[] = [ 'block' => self::clone_block_with_inner_blocks( $block, $current ) ];
		}

		return $segments;
	}

	/**
	 * Keep a container block's attributes while replacing its children.
	 *
	 * @param array<string,mixed>            $block
	 * @param array<int,array<string,mixed>> $inner_blocks
	 * @return array<string,mixed>
	 */
	private static function clone_block_with_inner_blocks( array $block, array $inner_blocks ): array {
		$clone         = $block;
		$inner_content = is_array( $block['innerContent'] ?? null ) ? $block['innerContent'] : [];
		$null_indexes  = array_keys( array_filter( $inner_content, static fn( $part ): bool => null === $part ) );
		$opening       = '';
		$closing       = '';

		if ( ! empty( $null_indexes ) ) {
			$first_null = (int) reset( $null_indexes );
			$last_null  = (int) end( $null_indexes );
			$opening    = implode( '', array_filter( array_slice( $inner_content, 0, $first_null ), 'is_string' ) );
			$closing    = implode( '', array_filter( array_slice( $inner_content, $last_null + 1 ), 'is_string' ) );
		}

		$clone['innerBlocks']  = $inner_blocks;
		$clone['innerContent'] = array_merge( [ $opening ], array_fill( 0, count( $inner_blocks ), null ), [ $closing ] );
		$clone['innerHTML']    = $opening . $closing;
		return $clone;
	}

	private static function render_step_progress( int $total_pages ): void {
		$template  = __( 'Step %1$d of %2$d', 'formspress' );
		$step_text = sprintf(
			/* translators: 1: current page number, 2: total page count. */
			$template,
			1,
			$total_pages
		);
		?>
		<div
			class="ff-form__step-counter"
			data-step-template="<?php echo esc_attr( $template ); ?>"
			aria-live="polite"
		><?php echo esc_html( $step_text ); ?></div>
		<div class="ff-form__progress" aria-hidden="true">
			<div
				class="ff-form__progress-bar"
				style="width: <?php echo esc_attr( (int) round( 100 / $total_pages ) ); ?>%"
			></div>
		</div>
		<?php
	}

	/**
	 * Split a flat field list by `page_break` boundaries.
	 *
	 * @param array<int,array<string,mixed>> $fields
	 *
	 * @return array<int,array<int,array<string,mixed>>>
	 */
	private static function split_pages( array $fields ): array {
		$pages   = [ [] ];
		$current = 0;

		foreach ( $fields as $field ) {
			if ( ( $field['type'] ?? '' ) === 'page_break' ) {
				$current++;
				$pages[ $current ] = [];
				continue;
			}
			$pages[ $current ][] = $field;
		}

		return $pages;
	}

	/**
	 * Render the bottom pagination + submit bar (progress + prev/next/submit).
	 *
	 * @param array<int,array<string,mixed>> $fields
	 * @param array<string,mixed>            $settings
	 */
	private static function render_pagination_bar( array $fields, array $settings ): void {
		$pages        = self::split_pages( $fields );
		$total_pages  = count( $pages );
		$submit_label = $settings['submit_label']        ?? __( 'Submit', 'formspress' );
		$prev_label   = $settings['prev_label']          ?? __( 'Previous', 'formspress' );
		$next_label   = $settings['next_label']          ?? __( 'Next', 'formspress' );
		?>
		<div class="ff-form__pagination" data-total-pages="<?php echo esc_attr( $total_pages ); ?>">
			<?php if ( $total_pages > 1 ) : ?>
				<div class="ff-form__progress" aria-hidden="true">
					<div
						class="ff-form__progress-bar"
						style="width: <?php echo esc_attr( (int) round( 100 / $total_pages ) ); ?>%"
					></div>
				</div>
			<?php endif; ?>
			<div class="ff-form__footer">
				<?php if ( $total_pages > 1 ) : ?>
					<button type="button" class="ff-form__prev" hidden>
						<?php echo esc_html( $prev_label ); ?>
					</button>
					<button type="button" class="ff-form__next" <?php echo ( $total_pages > 1 ) ? '' : 'hidden'; ?>>
						<?php echo esc_html( $next_label ); ?>
					</button>
					<button type="submit" class="ff-form__submit" hidden data-wp-bind--disabled="context.isSubmitting">
						<?php echo esc_html( $submit_label ); ?>
					</button>
				<?php else : ?>
					<button type="submit" class="ff-form__submit" data-wp-bind--disabled="context.isSubmitting">
						<?php echo esc_html( $submit_label ); ?>
					</button>
				<?php endif; ?>
			</div>
		</div>
		<?php
	}

	private static function render_markup_pagination_bar( int $total_pages, array $settings ): void {
		$prev_label = $settings['prev_label'] ?? __( 'Previous', 'formspress' );
		$next_label = $settings['next_label'] ?? __( 'Next', 'formspress' );
		?>
		<div class="ff-form__pagination" data-total-pages="<?php echo esc_attr( $total_pages ); ?>">
			<div class="ff-form__footer">
				<button type="button" class="ff-form__prev" hidden>
					<?php echo esc_html( $prev_label ); ?>
				</button>
				<button type="button" class="ff-form__next">
					<?php echo esc_html( $next_label ); ?>
				</button>
			</div>
		</div>
		<?php
	}

	/**
	 * Extract a compact field schema (id, type, options, conditions) used by the
	 * frontend runtime to evaluate conditional logic / pagination without
	 * re-fetching the full form definition.
	 *
	 * @param array<int,array<string,mixed>> $fields
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private static function extract_field_schema( array $fields ): array {
		$flat = [];
		$page = 0;
		foreach ( $fields as $field ) {
			$type = $field['type'] ?? '';
			if ( 'page_break' === $type ) {
				$page++;
				continue;
			}
			if ( 'row' === $type ) {
				foreach ( ( $field['cols'] ?? [] ) as $col ) {
					foreach ( ( $col['fields'] ?? [] ) as $child ) {
						$flat[] = self::compact_field( $child, $page );
					}
				}
				continue;
			}
			$flat[] = self::compact_field( $field, $page );
		}
		return $flat;
	}

	private static function compact_field( array $field, int $page ): array {
		return [
			'id'         => $field['id']         ?? '',
			'type'       => $field['type']       ?? 'text',
			'options'    => $field['options']    ?? [],
			'conditions' => $field['conditions'] ?? null,
			'page'       => $page,
		];
	}

	private static function render_field( array $field ): void {
		$type     = $field['type'] ?? 'text';
		$id       = esc_attr( $field['id'] ?? '' );
		$label    = esc_html( $field['label'] ?? '' );
		$required = ! empty( $field['required'] );
		$req_attr = $required ? 'required aria-required="true"' : '';
		$req_mark = $required
			? ' <span class="ff-form__required" aria-hidden="true">*</span><span class="screen-reader-text">' . esc_html__( '(required)', 'formspress' ) . '</span>'
			: '';

		// a11y: link inputs to description + error region.
		$has_desc      = ! empty( $field['description'] );
		$describedby   = trim(
			( $has_desc ? "ff-desc-{$id} " : '' ) . "ff-error-{$id}"
		);
		$desc_attr     = $describedby ? sprintf( ' aria-describedby="%s"', esc_attr( $describedby ) ) : '';
		$invalid_attr  = ' aria-invalid="false"';

		$conditions_attr = '';
		$initial_hidden_attr = '';
		if (
			! empty( $field['conditions'] )
			&& is_array( $field['conditions'] )
			&& ! empty( $field['conditions']['rules'] )
			&& apply_filters( 'flowforms_can_use_conditional_logic', false )
		) {
			$conditions_attr = sprintf( ' data-conditions="%s"', esc_attr( wp_json_encode( $field['conditions'] ) ) );
			if ( 'show' === ( $field['conditions']['action'] ?? 'show' ) ) {
				$initial_hidden_attr = ' hidden aria-hidden="true"';
			}
		}

		if ( $type === 'row' ) {
			echo '<div class="ff-form__row">';
			foreach ( ( $field['cols'] ?? [] ) as $col ) {
				$width = esc_attr( $col['width'] ?? '1/2' );
				echo '<div class="ff-form__col" data-width="' . $width . '">';
				foreach ( ( $col['fields'] ?? [] ) as $child_field ) {
					self::render_field( $child_field );
				}
				echo '</div>';
			}
			echo '</div>';
			return;
		}

		if ( $type === 'section' ) : ?>
			<div class="ff-form__section" data-field-id="<?php echo $id; ?>"<?php echo $conditions_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $initial_hidden_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
				<p class="ff-form__section-title"><?php echo $label; ?></p>
				<?php if ( ! empty( $field['content'] ) ) : ?><p><?php echo esc_html( $field['content'] ); ?></p><?php endif; ?>
			</div>
			<?php return;
		endif;

		if ( $type === 'page_break' ) :
			// Pagination handled by render_paged_fields(); skip here.
			return;
		endif;

		if ( $type === 'hidden' ) :
			echo '<input type="hidden" name="' . $id . '" value="' . esc_attr( $field['default_value'] ?? '' ) . '" />';
			return;
		endif;

		/* Unknown / extension types — delegate to the registry. */
		$known_types = [ 'text', 'email', 'phone', 'number', 'url', 'textarea', 'select', 'radio', 'checkbox', 'rating', 'date', 'time', 'file' ];
		if ( ! in_array( $type, $known_types, true ) ) {
			$registry = self::field_types();
			$type_obj = $registry ? $registry->get( $type ) : null;
			if ( $type_obj ) {
				echo '<div class="ff-form__field" id="ff-field-wrap-' . $id . '" data-field-id="' . $id . '"' . $conditions_attr . $initial_hidden_attr . '>'; // phpcs:ignore WordPress.Security.EscapeOutput
				echo '<label for="ff-field-' . $id . '" class="ff-form__label">' . $label . $req_mark . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
				if ( ! empty( $field['description'] ) ) {
					echo '<p class="ff-form__description-text" id="ff-desc-' . $id . '">' . esc_html( $field['description'] ) . '</p>'; // phpcs:ignore WordPress.Security.EscapeOutput
				}
				echo $type_obj->render_frontend( $field ); // phpcs:ignore WordPress.Security.EscapeOutput
				echo '<div class="ff-form__field-error" id="ff-error-' . $id . '" role="alert" aria-live="polite" aria-atomic="true"></div>'; // phpcs:ignore WordPress.Security.EscapeOutput
				echo '</div>';
				return;
			}
		}
		?>
		<div class="ff-form__field" id="ff-field-wrap-<?php echo $id; ?>" data-field-id="<?php echo $id; ?>"<?php echo $conditions_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $initial_hidden_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
			<?php
			// Radio + checkbox groups: use fieldset/legend so the group has a
			// proper accessible name for screen readers (WCAG 1.3.1, 4.1.2).
			$is_group = in_array( $type, [ 'radio', 'checkbox' ], true );
			if ( $is_group ) :
			?>
				<fieldset class="ff-form__fieldset" <?php echo $required ? 'aria-required="true"' : ''; ?>>
					<legend class="ff-form__label"><?php echo $label; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $req_mark; // phpcs:ignore WordPress.Security.EscapeOutput ?></legend>
					<?php if ( $has_desc ) : ?>
						<p class="ff-form__description-text" id="ff-desc-<?php echo $id; ?>"><?php echo esc_html( $field['description'] ); ?></p>
					<?php endif; ?>
			<?php else : ?>
				<label for="ff-field-<?php echo $id; ?>" class="ff-form__label">
					<?php echo $label; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $req_mark; // phpcs:ignore WordPress.Security.EscapeOutput ?>
				</label>
				<?php if ( $has_desc ) : ?>
					<p class="ff-form__description-text" id="ff-desc-<?php echo $id; ?>"><?php echo esc_html( $field['description'] ); ?></p>
				<?php endif; ?>
			<?php endif; ?>

			<?php if ( $type === 'textarea' ) : ?>
				<textarea
					name="<?php echo $id; ?>"
					id="ff-field-<?php echo $id; ?>"
					class="ff-form__textarea"
					placeholder="<?php echo esc_attr( $field['placeholder'] ?? '' ); ?>"
					<?php echo $req_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?>
					<?php echo $desc_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?>
					<?php echo $invalid_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?>
				></textarea>

			<?php elseif ( $type === 'select' ) : ?>
				<select name="<?php echo $id; ?>" id="ff-field-<?php echo $id; ?>" class="ff-form__select" <?php echo $req_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $desc_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $invalid_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
					<option value=""><?php esc_html_e( 'Select…', 'formspress' ); ?></option>
					<?php foreach ( $field['options'] ?? [] as $opt ) : ?>
						<option value="<?php echo esc_attr( $opt ); ?>"><?php echo esc_html( $opt ); ?></option>
					<?php endforeach; ?>
				</select>

			<?php elseif ( $type === 'radio' ) : ?>
				<div class="ff-form__choices"<?php echo $desc_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
					<?php foreach ( $field['options'] ?? [] as $i => $opt ) : ?>
						<label class="ff-form__choice" for="ff-field-<?php echo $id; ?>-<?php echo (int) $i; ?>">
							<input
								type="radio"
								id="ff-field-<?php echo $id; ?>-<?php echo (int) $i; ?>"
								name="<?php echo $id; ?>"
								value="<?php echo esc_attr( $opt ); ?>"
								<?php echo ( $i === 0 && $required ) ? 'required aria-required="true"' : ''; ?>
							/>
							<span><?php echo esc_html( $opt ); ?></span>
						</label>
					<?php endforeach; ?>
				</div>

			<?php elseif ( $type === 'checkbox' ) : ?>
				<div class="ff-form__choices"<?php echo $desc_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
					<?php foreach ( $field['options'] ?? [] as $i => $opt ) : ?>
						<label class="ff-form__choice" for="ff-field-<?php echo $id; ?>-<?php echo (int) $i; ?>">
							<input
								type="checkbox"
								id="ff-field-<?php echo $id; ?>-<?php echo (int) $i; ?>"
								name="<?php echo $id; ?>[]"
								value="<?php echo esc_attr( $opt ); ?>"
							/>
							<span><?php echo esc_html( $opt ); ?></span>
						</label>
					<?php endforeach; ?>
				</div>

			<?php elseif ( $type === 'rating' ) :
				$max = (int) ( $field['max'] ?? 5 );
			?>
				<div
					class="ff-form__rating"
					role="radiogroup"
					aria-label="<?php echo esc_attr( $field['label'] ?? __( 'Rating', 'formspress' ) ); ?>"
					<?php echo $desc_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?>
					data-max="<?php echo esc_attr( $max ); ?>"
				>
					<input type="hidden" name="<?php echo $id; ?>" class="ff-rating-value" <?php echo $req_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?> />
					<?php for ( $i = 1; $i <= $max; $i++ ) : ?>
						<button
							type="button"
							class="ff-form__star"
							role="radio"
							aria-checked="false"
							tabindex="<?php echo 1 === $i ? '0' : '-1'; ?>"
							data-value="<?php echo $i; ?>"
							data-wp-on--click="actions.rateStar"
							data-wp-on--keydown="actions.rateStarKey"
							aria-label="<?php echo esc_attr( sprintf(
								/* translators: 1: current star, 2: total stars. */
								__( '%1$d out of %2$d', 'formspress' ),
								$i,
								$max
							) ); ?>"
						>★</button>
					<?php endfor; ?>
				</div>

			<?php elseif ( $type === 'date' ) : ?>
				<input type="date" name="<?php echo $id; ?>" id="ff-field-<?php echo $id; ?>" class="ff-form__input" <?php echo $req_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $desc_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $invalid_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?> />

			<?php elseif ( $type === 'time' ) : ?>
				<input type="time" name="<?php echo $id; ?>" id="ff-field-<?php echo $id; ?>" class="ff-form__input" <?php echo $req_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $desc_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $invalid_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?> />

			<?php elseif ( $type === 'file' ) : ?>
				<input type="file" name="<?php echo $id; ?>" id="ff-field-<?php echo $id; ?>" class="ff-form__input" <?php echo $req_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $desc_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo $invalid_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?> />

			<?php else :
				$input_type = match ( $type ) {
					'email'  => 'email',
					'url'    => 'url',
					'number' => 'number',
					'phone'  => 'tel',
					default  => 'text',
				};
				$autocomplete = match ( $type ) {
					'email' => 'email',
					'phone' => 'tel',
					'url'   => 'url',
					default => '',
				};
			?>
				<input
					type="<?php echo $input_type; ?>"
					name="<?php echo $id; ?>"
					id="ff-field-<?php echo $id; ?>"
					class="ff-form__input"
					placeholder="<?php echo esc_attr( $field['placeholder'] ?? '' ); ?>"
					<?php if ( $autocomplete ) : ?>autocomplete="<?php echo esc_attr( $autocomplete ); ?>"<?php endif; ?>
					<?php echo $req_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?>
					<?php echo $desc_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?>
					<?php echo $invalid_attr; // phpcs:ignore WordPress.Security.EscapeOutput ?>
				/>
			<?php endif; ?>

			<div class="ff-form__field-error" id="ff-error-<?php echo $id; ?>" role="alert" aria-live="polite" aria-atomic="true"></div>
			<?php if ( $is_group ) : ?>
				</fieldset>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * Shortcode handler: [flowform id="X"]
	 *
	 * @param array<string,mixed> $atts
	 */
	public static function render_shortcode( array $atts ): string {
		$atts    = shortcode_atts( [ 'id' => 0 ], $atts, 'formspress' );
		$form_id = absint( $atts['id'] );

		if ( ! $form_id ) {
			return '';
		}

		global $wpdb;
		$type = $wpdb->get_var(
			$wpdb->prepare( "SELECT type FROM {$wpdb->prefix}ff_forms WHERE id = %d AND status = 'active'", $form_id )
		);

		if ( ! $type ) {
			return '';
		}

		if ( 'flow' === $type ) {
			return self::render_flow_form_markup( [ 'formId' => $form_id ], false );
		}

		return self::render_standard_form( [ 'formId' => $form_id ], false );
	}

	/**
	 * Render a fullscreen form page for the /formspress/{id}/ direct link.
	 * Outputs a complete HTML document and exits.
	 */
	public static function render_fullscreen( int $form_id ): void {
		$form = self::load_form_row( $form_id, 'any', ! current_user_can( 'manage_options' ) );
		if ( ! $form ) {
			wp_safe_redirect( home_url() );
			exit;
		}

		/** @see render_standard_form() */
		$form = apply_filters( 'flowforms_get_form_for_render', $form );

		$settings    = $form['settings'];
		$theme       = $settings['theme'] ?? [];
		$theme_style = self::build_theme_style( $theme );
		$std_style   = self::build_standard_style( $settings['style'] ?? [] );
		$body_bg     = ! empty( $theme['bg'] ) ? sanitize_hex_color( $theme['bg'] ) : '#ffffff';
		$is_flow     = 'flow' === $form['type'];

		$core_blocks_css_url = esc_url( includes_url( 'css/dist/block-library/style.min.css' ) );
		$css_url             = esc_url( FLOWFORMS_URL . 'assets/frontend/forms.css' ) . '?v=' . FLOWFORMS_VERSION;
		$js_url              = esc_url( FLOWFORMS_URL . 'assets/frontend/forms.js' )  . '?v=' . FLOWFORMS_VERSION;

		$ff_data = wp_json_encode( [
			'apiRoot' => esc_url_raw( rest_url( 'flowforms/v1' ) ),
			'nonce'   => wp_create_nonce( 'wp_rest' ),
		] );

		status_header( 200 );
		header( 'Content-Type: text/html; charset=utf-8' );

		?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?php echo esc_html( $form['title'] ); ?></title>
<link rel="stylesheet" href="<?php echo $core_blocks_css_url; ?>">
<link rel="stylesheet" href="<?php echo $css_url; ?>">
<style>
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; min-height: 100vh; background: <?php echo esc_attr( $body_bg ); ?>; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.ff-fullscreen { min-height: 100vh; display: flex; flex-direction: column; }
.ff-form--flow.ff-form--fullscreen { min-height: 100vh; }
</style>
</head>
<body>
<div class="ff-fullscreen">
<?php if ( $is_flow ) : ?>
	<div
		class="ff-form ff-form--flow ff-form--fullscreen"
		id="ff-form-<?php echo esc_attr( $form_id ); ?>"
		data-form-id="<?php echo esc_attr( $form_id ); ?>"
		data-form-title="<?php echo esc_attr( $form['title'] ); ?>"
		data-type="flow"
		<?php if ( ! empty( $form['variant_id'] ) ) : ?>data-variant-id="<?php echo esc_attr( $form['variant_id'] ); ?>"<?php endif; ?>
		data-fields="<?php echo esc_attr( wp_json_encode( $form['fields'] ) ); ?>"
		data-settings="<?php echo esc_attr( wp_json_encode( $settings ) ); ?>"
		<?php if ( $theme_style ) : ?>style="<?php echo esc_attr( $theme_style ); ?>"<?php endif; ?>
	></div>
<?php else : ?>
	<form
		class="ff-form ff-form--standard ff-form--fullscreen"
		method="post"
		id="ff-form-<?php echo esc_attr( $form_id ); ?>"
		data-form-id="<?php echo esc_attr( $form_id ); ?>"
		data-type="standard"
		<?php if ( ! empty( $form['variant_id'] ) ) : ?>data-variant-id="<?php echo esc_attr( $form['variant_id'] ); ?>"<?php endif; ?>
		novalidate
		<?php echo self::spam_data_attrs(); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		<?php if ( $std_style ) : ?>style="<?php echo esc_attr( $std_style ); ?>"<?php endif; ?>
	>
		<?php
		// Same branching as `render_standard_form` — markup forms need
		// the page-break aware renderer, while legacy schema forms keep
		// the per-field renderer.
		$markup_total_pages = 1;
		if ( ! empty( $form['is_markup'] ) && ! empty( $form['fields_markup'] ) ) {
			$markup_total_pages = self::render_paged_markup( $form['fields_markup'], $form['settings'] );
		} else {
			self::render_paged_fields( $form['fields'], $form['settings'] );
		}
		?>

		<div class="ff-form__honeypot" aria-hidden="true">
			<label for="ff_hp_<?php echo esc_attr( $form_id ); ?>">Leave this field empty</label>
			<input type="text" name="_ff_hp" id="ff_hp_<?php echo esc_attr( $form_id ); ?>" tabindex="-1" autocomplete="off" />
		</div>

		<?php echo self::spam_widget_html(); // phpcs:ignore WordPress.Security.EscapeOutput ?>

		<input type="hidden" name="_source_url" value="<?php echo esc_url( home_url( '/formspress/' . $form_id . '/' ) ); ?>" />
		<input type="hidden" name="_ff_current_page" value="0" />

		<?php
		if ( empty( $form['is_markup'] ) ) {
			self::render_pagination_bar( $form['fields'], $form['settings'] );
		} elseif ( $markup_total_pages > 1 ) {
			self::render_markup_pagination_bar( $markup_total_pages, $form['settings'] );
		}
		?>

		<div class="ff-form__messages" aria-live="polite"></div>
	</form>
<?php endif; ?>
</div>
<script>window.ffData = <?php echo $ff_data; ?>;</script>
<script src="<?php echo $js_url; ?>"></script>
</body>
</html>
		<?php
		exit;
	}

	/**
	 * Build inline CSS custom-property string from a theme array (flow forms).
	 *
	 * @param array<string,string> $theme
	 */
	private static function build_theme_style( array $theme ): string {
		$style = '';
		if ( ! empty( $theme['bg'] ) )      $style .= '--ff-bg:'       . sanitize_hex_color( $theme['bg'] )      . ';';
		if ( ! empty( $theme['text'] ) )    $style .= '--ff-text:'     . sanitize_hex_color( $theme['text'] )    . ';';
		if ( ! empty( $theme['primary'] ) ) $style .= '--ff-primary:'  . sanitize_hex_color( $theme['primary'] ) . ';';
		if ( ! empty( $theme['btnText'] ) ) $style .= '--ff-btn-text:' . sanitize_hex_color( $theme['btnText'] ) . ';';
		return $style;
	}

	/**
	 * Build theme-bound CSS — references `--wp--preset--*` rather than hex.
	 * The form's appearance follows the active site style variation.
	 *
	 * Slug map (form slot → theme.json preset slug, with sensible fallback):
	 *   --ff-bg          → --wp--preset--color--base
	 *   --ff-text        → --wp--preset--color--contrast
	 *   --ff-primary     → --wp--preset--color--primary
	 *   --ff-btn-text    → --wp--preset--color--base
	 *   --ff-label-color → --wp--preset--color--contrast
	 *   --ff-color-border (kept stored if any, otherwise neutral)
	 *   --ff-font-family → --wp--preset--font-family--body
	 *
	 * @param array<string,mixed> $style
	 */
	private static function build_theme_bound_style( array $style ): string {
		$parts = [
			'--ff-bg:var(--wp--preset--color--base, #ffffff)',
			'--ff-text:var(--wp--preset--color--contrast, #1d2327)',
			'--ff-primary:var(--wp--preset--color--primary, #2271b1)',
			'--ff-btn-text:var(--wp--preset--color--base, #ffffff)',
			'--ff-label-color:var(--wp--preset--color--contrast, #1d2327)',
			'--ff-font-family:var(--wp--preset--font-family--body, inherit)',
		];

		$pagination_color_map = [
			'progress_fill_color' => '--ff-progress-fill',
			'progress_track_color' => '--ff-progress-track',
			'step_text_color'     => '--ff-step-text',
			'next_bg_color'       => '--ff-next-bg',
			'next_text_color'     => '--ff-next-text',
			'next_border_color'   => '--ff-next-border-color',
			'prev_bg_color'       => '--ff-prev-bg',
			'prev_text_color'     => '--ff-prev-text',
			'prev_border_color'   => '--ff-prev-border-color',
		];
		foreach ( $pagination_color_map as $key => $var ) {
			if ( ! empty( $style[ $key ] ) ) {
				$color = sanitize_hex_color( $style[ $key ] );
				if ( $color ) {
					$parts[] = $var . ':' . $color;
				}
			}
		}

		/* Layout-only knobs still apply (radii / spacing / borders). */
		if ( isset( $style['border_radius'] ) ) {
			$parts[] = '--ff-border-radius:' . absint( $style['border_radius'] ) . 'px';
		}
		if ( isset( $style['border_width'] ) ) {
			$parts[] = '--ff-border-width:' . absint( $style['border_width'] ) . 'px';
		}
		if ( isset( $style['input_padding_x'] ) ) {
			$parts[] = '--ff-input-px:' . absint( $style['input_padding_x'] ) . 'px';
		}
		if ( isset( $style['input_padding_y'] ) ) {
			$parts[] = '--ff-input-py:' . absint( $style['input_padding_y'] ) . 'px';
		}
		if ( isset( $style['field_spacing'] ) ) {
			$parts[] = '--ff-field-spacing:' . absint( $style['field_spacing'] ) . 'px';
		}
		if ( isset( $style['btn_radius'] ) ) {
			$parts[] = '--ff-btn-radius:' . absint( $style['btn_radius'] ) . 'px';
		}
		if ( ! empty( $style['label_weight'] ) && in_array( $style['label_weight'], [ '400', '500', '600', '700' ], true ) ) {
			$parts[] = '--ff-label-weight:' . $style['label_weight'];
		}
		if ( ! empty( $style['btn_width'] ) && 'full' === $style['btn_width'] ) {
			$parts[] = '--ff-btn-width:100%';
		}
		$border_style = $style['border_style'] ?? 'solid';
		if ( in_array( $border_style, [ 'solid', 'dashed', 'none' ], true ) ) {
			$parts[] = '--ff-border-style:' . $border_style;
		}

		/* Button style — uses theme-bound colours rather than stored hex. */
		$btn_style = $style['btn_style'] ?? 'solid';
		switch ( $btn_style ) {
			case 'outline':
				$parts[] = '--ff-btn-bg-actual:transparent';
				$parts[] = '--ff-btn-color-actual:var(--wp--preset--color--primary, #2271b1)';
				$parts[] = '--ff-btn-border-actual:2px solid var(--wp--preset--color--primary, #2271b1)';
				break;
			case 'ghost':
				$parts[] = '--ff-btn-bg-actual:transparent';
				$parts[] = '--ff-btn-color-actual:var(--wp--preset--color--primary, #2271b1)';
				$parts[] = '--ff-btn-border-actual:none';
				break;
			case 'solid':
			default:
				$parts[] = '--ff-btn-bg-actual:var(--wp--preset--color--primary, #2271b1)';
				$parts[] = '--ff-btn-color-actual:var(--wp--preset--color--base, #ffffff)';
				$parts[] = '--ff-btn-border-actual:none';
				break;
		}

		return implode( ';', $parts );
	}

	/**
	 * Build inline CSS custom-property string from style settings (standard forms).
	 *
	 * When `$style['source'] === 'theme'` the form binds its colour/font slots
	 * to the theme.json CSS custom properties (`--wp--preset--*`) instead of
	 * stored literal hex values. The form auto-tracks site style variations
	 * without re-saving.
	 *
	 * @param array<string,mixed> $style
	 */
	private static function build_standard_style( array $style ): string {
		if ( ( $style['source'] ?? 'custom' ) === 'theme' ) {
			return self::build_theme_bound_style( $style );
		}

		$parts = [];

		$color_map = [
			'primary_color'        => '--ff-primary',
			'btn_text_color'       => '--ff-btn-text',
			'bg_color'             => '--ff-bg',
			'text_color'           => '--ff-text',
			'border_color'         => '--ff-color-border',
			'label_color'          => '--ff-label-color',
			'progress_fill_color'  => '--ff-progress-fill',
			'progress_track_color' => '--ff-progress-track',
			'step_text_color'      => '--ff-step-text',
			'next_bg_color'        => '--ff-next-bg',
			'next_text_color'      => '--ff-next-text',
			'next_border_color'    => '--ff-next-border-color',
			'prev_bg_color'        => '--ff-prev-bg',
			'prev_text_color'      => '--ff-prev-text',
			'prev_border_color'    => '--ff-prev-border-color',
		];
		foreach ( $color_map as $key => $var ) {
			if ( ! empty( $style[ $key ] ) ) {
				$color = sanitize_hex_color( $style[ $key ] );
				if ( $color ) {
					$parts[] = $var . ':' . $color;
				}
			}
		}

		if ( isset( $style['font_size'] ) && $style['font_size'] > 0 ) {
			$parts[] = '--ff-font-size:' . absint( $style['font_size'] ) . 'px';
		}
		if ( ! empty( $style['font_family'] ) ) {
			$parts[] = '--ff-font-family:' . sanitize_text_field( $style['font_family'] );
		}
		if ( isset( $style['border_radius'] ) ) {
			$parts[] = '--ff-border-radius:' . absint( $style['border_radius'] ) . 'px';
		}
		if ( isset( $style['border_width'] ) ) {
			$parts[] = '--ff-border-width:' . absint( $style['border_width'] ) . 'px';
		}
		if ( isset( $style['input_padding_x'] ) ) {
			$parts[] = '--ff-input-px:' . absint( $style['input_padding_x'] ) . 'px';
		}
		if ( isset( $style['input_padding_y'] ) ) {
			$parts[] = '--ff-input-py:' . absint( $style['input_padding_y'] ) . 'px';
		}
		if ( isset( $style['field_spacing'] ) ) {
			$parts[] = '--ff-field-spacing:' . absint( $style['field_spacing'] ) . 'px';
		}
		if ( isset( $style['btn_radius'] ) ) {
			$parts[] = '--ff-btn-radius:' . absint( $style['btn_radius'] ) . 'px';
		}
		if ( ! empty( $style['label_weight'] ) && in_array( $style['label_weight'], [ '400', '500', '600', '700' ], true ) ) {
			$parts[] = '--ff-label-weight:' . $style['label_weight'];
		}
		if ( ! empty( $style['btn_width'] ) && 'full' === $style['btn_width'] ) {
			$parts[] = '--ff-btn-width:100%';
		}

		/* Border style: solid | dashed | none */
		$border_style = $style['border_style'] ?? 'solid';
		if ( in_array( $border_style, [ 'solid', 'dashed', 'none' ], true ) ) {
			$parts[] = '--ff-border-style:' . $border_style;
		}

		/* Button style: solid | outline | ghost — translate into actual CSS vars. */
		$btn_style    = $style['btn_style'] ?? 'solid';
		$primary_hex  = ! empty( $style['primary_color'] )  ? sanitize_hex_color( $style['primary_color'] )  : '';
		$btn_text_hex = ! empty( $style['btn_text_color'] ) ? sanitize_hex_color( $style['btn_text_color'] ) : '';

		switch ( $btn_style ) {
			case 'outline':
				$parts[] = '--ff-btn-bg-actual:transparent';
				if ( $primary_hex ) {
					$parts[] = '--ff-btn-color-actual:' . $primary_hex;
					$parts[] = '--ff-btn-border-actual:2px solid ' . $primary_hex;
				} else {
					$parts[] = '--ff-btn-color-actual:var(--ff-primary)';
					$parts[] = '--ff-btn-border-actual:2px solid var(--ff-primary)';
				}
				break;
			case 'ghost':
				$parts[] = '--ff-btn-bg-actual:transparent';
				if ( $primary_hex ) {
					$parts[] = '--ff-btn-color-actual:' . $primary_hex;
				} else {
					$parts[] = '--ff-btn-color-actual:var(--ff-primary)';
				}
				$parts[] = '--ff-btn-border-actual:none';
				break;
			case 'solid':
			default:
				if ( $primary_hex ) {
					$parts[] = '--ff-btn-bg-actual:' . $primary_hex;
				} else {
					$parts[] = '--ff-btn-bg-actual:var(--ff-primary)';
				}
				if ( $btn_text_hex ) {
					$parts[] = '--ff-btn-color-actual:' . $btn_text_hex;
				} else {
					$parts[] = '--ff-btn-color-actual:var(--ff-btn-text, #fff)';
				}
				$parts[] = '--ff-btn-border-actual:none';
				break;
		}

		return implode( ';', $parts );
	}

	/**
	 * Register the shared frontend assets. Called from BlocksModule on init
	 * so the `formspress-frontend` style handle exists when block.json
	 * resolves its `style` field. Idempotent.
	 */
	public static function register_frontend_assets(): void {
		static $registered = false;
		if ( $registered ) {
			return;
		}
		$registered = true;

		/* Style handle referenced by block.json `style: formspress-frontend`. */
		wp_register_style(
			'formspress-frontend',
			FLOWFORMS_URL . 'assets/frontend/forms.css',
			[],
			FLOWFORMS_VERSION
		);

		/* Legacy alias — keeps any direct enqueues working. */
		wp_register_style(
			'flowforms-frontend',
			FLOWFORMS_URL . 'assets/frontend/forms.css',
			[],
			FLOWFORMS_VERSION
		);

		/* Imperative runtime — only loaded when a flow form is on the page
		 * (see enqueue_frontend_assets). Standard forms use the
		 * Interactivity API view.js module registered via block.json. */
		wp_register_script(
			'flowforms-frontend',
			FLOWFORMS_URL . 'assets/frontend/forms.js',
			[],
			FLOWFORMS_VERSION,
			true
		);

		/* Bootstrap Interactivity API state. Available to view.js modules
		 * via the shared store/context — keeps the REST contract unchanged. */
		if ( function_exists( 'wp_interactivity_state' ) ) {
			wp_interactivity_state( 'formspress', [
				'apiRoot' => esc_url_raw( rest_url( 'flowforms/v1' ) ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
			] );
		}
	}

	private static function enqueue_frontend_assets(): void {
		static $enqueued = false;

		if ( $enqueued ) {
			return;
		}

		$enqueued = true;

		self::register_frontend_assets();

		wp_enqueue_style( 'formspress-frontend' );

		wp_enqueue_script( 'flowforms-frontend' );

		wp_localize_script( 'flowforms-frontend', 'ffData', [
			'apiRoot'  => esc_url_raw( rest_url( 'flowforms/v1' ) ),
			'nonce'    => wp_create_nonce( 'wp_rest' ),
		] );

		do_action( 'flowforms_frontend_assets_enqueued' );
	}
}
