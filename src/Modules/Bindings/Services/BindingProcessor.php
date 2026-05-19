<?php

namespace FlowForms\Modules\Bindings\Services;

use FlowForms\Modules\Entries\Services\Conditional\ConditionEvaluator;
use FlowForms\Modules\Forms\Services\FormRepository;

/**
 * Runs FIELD-level bindings after an entry is saved.
 *
 * Each form field can carry an optional `binding` config:
 *
 *     field.binding = [
 *         'target' => 'cpt' | 'post_meta' | 'user_meta' | 'option' | <custom>,
 *         'source' => [
 *             'post_type'  => 'lead',     // cpt / post_meta
 *             'meta_key'   => 'company',  // cpt / post_meta / user_meta
 *             'option_key' => 'last_signup_email', // option
 *         ],
 *     ];
 *
 * Behavior:
 *  - First field with target=cpt becomes the "primary" — triggers
 *    `wp_insert_post`. The resulting $post_id is then reused by every
 *    field with target=post_meta in the same submission.
 *  - target=user_meta requires resolving a user by email. We never
 *    auto-register users.
 *  - target=option writes via `update_option`.
 *  - target=<custom> delegates to a registered handler (BindingSourceRegistry).
 *
 * Hooks in via `flowforms_entry_created`.
 */
class BindingProcessor {

	public function __construct(
		private readonly FormRepository $form_repo,
		private readonly ConditionEvaluator $conditions,
		private readonly BindingSourceRegistry $registry,
	) {}

	public function boot(): void {
		add_action( 'flowforms_entry_created', [ $this, 'process_entry' ], 10, 2 );
		add_action( 'init', [ $this, 'maybe_register_cpts' ], 9 );
	}

	/**
	 * Auto-register CPTs referenced by form bindings, but only if the host
	 * theme/plugin opted in. Defaults to false so themes stay in charge.
	 */
	public function maybe_register_cpts(): void {
		if ( ! apply_filters( 'flowforms_auto_register_cpts', false ) ) {
			return;
		}

		$post_types = $this->collect_bound_post_types();
		if ( empty( $post_types ) ) {
			return;
		}

		foreach ( $post_types as $slug ) {
			if ( post_type_exists( $slug ) ) {
				continue;
			}
			$slug = sanitize_key( $slug );
			if ( '' === $slug ) {
				continue;
			}
			$nice = ucwords( str_replace( [ '_', '-' ], ' ', $slug ) );
			register_post_type( $slug, [
				'label'       => $nice,
				'public'      => false,
				'show_ui'     => true,
				'show_in_menu' => true,
				'menu_icon'   => 'dashicons-feedback',
				'supports'    => [ 'title', 'editor', 'custom-fields' ],
				'capability_type' => 'post',
			] );
		}
	}

	/**
	 * Called after `EntryProcessor::process()` saves a new entry.
	 *
	 * @param array<string, mixed> $entry  Entry row (id, form_id, values, ...).
	 * @param array<string, mixed> $form   Form definition.
	 */
	public function process_entry( array $entry, array $form ): void {
		$fields = $this->conditions->flattenFields( $form['fields'] ?? [] );
		if ( empty( $fields ) ) {
			return;
		}

		$values_by_id = $this->index_values( $entry['values'] ?? [] );

		/* Phase 1 — locate the "primary" CPT field, if any. */
		$primary       = null;
		$post_meta_qty = [];
		$user_meta_qty = [];
		$options       = [];
		$customs       = [];

		foreach ( $fields as $field ) {
			$binding = $field['binding'] ?? null;
			if ( ! is_array( $binding ) || empty( $binding['target'] ) ) {
				continue;
			}
			$target = (string) $binding['target'];
			switch ( $target ) {
				case 'cpt':
					if ( null === $primary ) {
						$primary = $field;
					}
					break;
				case 'post_meta':
					$post_meta_qty[] = $field;
					break;
				case 'user_meta':
					$user_meta_qty[] = $field;
					break;
				case 'option':
					$options[] = $field;
					break;
				default:
					$customs[] = $field;
			}
		}

		/* Phase 2 — CPT creation. */
		$post_id = 0;
		if ( null !== $primary ) {
			$post_id = $this->create_cpt_for_binding( $primary, $form, $entry, $values_by_id );

			/* If creation failed, surface the issue without breaking
			 * other bindings — log and continue. */
			if ( 0 === $post_id ) {
				$this->log( sprintf( 'CPT creation skipped for form #%d (target unavailable)', (int) ( $form['id'] ?? 0 ) ) );
			} elseif ( ! empty( $entry['id'] ) && $this->entries_have_post_id_column() ) {
				/* Link entry to created post. Column is added by the
				 * 2026_05_16 migration; older installs skip the link
				 * until the migration runs. */
				global $wpdb;
				$wpdb->update(
					$wpdb->prefix . 'ff_entries',
					[ 'post_id' => $post_id ],
					[ 'id' => (int) $entry['id'] ],
					[ '%d' ],
					[ '%d' ]
				);
			}
		}

		/* Phase 3 — post_meta on the freshly created post. */
		if ( $post_id > 0 ) {
			foreach ( $post_meta_qty as $field ) {
				$meta_key = sanitize_key( $field['binding']['source']['meta_key'] ?? '' );
				if ( '' === $meta_key ) {
					continue;
				}
				$value = $this->resolve_value( $field, $values_by_id );
				update_post_meta( $post_id, $meta_key, $value );
			}
		}

		/* Phase 4 — user_meta (existing users only). */
		$email = $this->resolve_user_email( $user_meta_qty, $values_by_id );
		if ( '' !== $email ) {
			$user = get_user_by( 'email', $email );
			if ( $user ) {
				foreach ( $user_meta_qty as $field ) {
					$meta_key = sanitize_key( $field['binding']['source']['meta_key'] ?? '' );
					if ( '' === $meta_key || $meta_key === '_email' ) {
						continue;
					}
					$value = $this->resolve_value( $field, $values_by_id );
					update_user_meta( $user->ID, $meta_key, $value );
				}
			} else {
				$this->log( sprintf( 'user_meta binding skipped — no user for %s', $email ) );
			}
		}

		/* Phase 5 — options. */
		foreach ( $options as $field ) {
			$option_key = sanitize_key( $field['binding']['source']['option_key'] ?? '' );
			if ( '' === $option_key ) {
				continue;
			}
			$value = $this->resolve_value( $field, $values_by_id );
			update_option( $option_key, $value );
		}

		/* Phase 6 — custom targets delegated to BindingSourceRegistry. */
		$context = [
			'form'    => $form,
			'entry'   => $entry,
			'post_id' => $post_id,
		];
		foreach ( $customs as $field ) {
			$target  = (string) ( $field['binding']['target'] ?? '' );
			$handler = $this->registry->get( $target );
			if ( null === $handler ) {
				continue;
			}
			$source = (array) ( $field['binding']['source'] ?? [] );
			$value  = $this->resolve_value( $field, $values_by_id );

			try {
				if ( is_callable( $handler ) ) {
					$handler( $value, $source, $field, $entry, $context );
				} elseif ( is_object( $handler ) && method_exists( $handler, 'handle' ) ) {
					$handler->handle( $value, $source, $field, $entry, $context );
				}
			} catch ( \Throwable $e ) {
				$this->log( sprintf( 'binding %s threw: %s', $target, $e->getMessage() ) );
			}
		}
	}

	/**
	 * @return int new post ID, or 0 on failure.
	 */
	private function create_cpt_for_binding( array $primary, array $form, array $entry, array $values_by_id ): int {
		$post_type = sanitize_key( $primary['binding']['source']['post_type'] ?? '' );
		if ( '' === $post_type ) {
			return 0;
		}
		if ( ! post_type_exists( $post_type ) ) {
			$this->log( sprintf(
				/* translators: %s post type slug */
				__( 'Register the CPT %s in your theme/functions.php before using this binding.', 'flowforms' ),
				$post_type
			) );
			return 0;
		}

		$title_base = sanitize_text_field( $form['title'] ?? 'Submission' );
		$entry_id   = (int) ( $entry['id'] ?? 0 );

		$content_field_id = sanitize_key( $primary['binding']['source']['content_field'] ?? '' );
		$content          = '' !== $content_field_id ? (string) ( $values_by_id[ $content_field_id ] ?? '' ) : '';

		$post_id = wp_insert_post( [
			'post_type'    => $post_type,
			'post_title'   => sprintf( '%s #%d', $title_base, $entry_id ),
			'post_status'  => apply_filters( 'flowforms_binding_default_post_status', 'publish', $form, $entry ),
			'post_content' => wp_kses_post( $content ),
		], true );

		if ( is_wp_error( $post_id ) || ! $post_id ) {
			$this->log( 'wp_insert_post failed for binding' );
			return 0;
		}

		/* If the primary field itself has a meta_key, store its own value too. */
		$primary_meta = sanitize_key( $primary['binding']['source']['meta_key'] ?? '' );
		if ( '' !== $primary_meta ) {
			$value = $this->resolve_value( $primary, $values_by_id );
			update_post_meta( $post_id, $primary_meta, $value );
		}

		return (int) $post_id;
	}

	/** @param array<int, array<string, mixed>> $user_meta_fields */
	private function resolve_user_email( array $user_meta_fields, array $values_by_id ): string {
		/* Explicit anchor: a field with meta_key '_email'. */
		foreach ( $user_meta_fields as $field ) {
			if ( sanitize_key( $field['binding']['source']['meta_key'] ?? '' ) === '_email' ) {
				$v = $this->resolve_value( $field, $values_by_id );
				if ( is_email( $v ) ) {
					return sanitize_email( $v );
				}
			}
		}
		/* Fallback: first email-typed field. */
		foreach ( $user_meta_fields as $field ) {
			if ( ( $field['type'] ?? '' ) === 'email' ) {
				$v = $this->resolve_value( $field, $values_by_id );
				if ( is_email( $v ) ) {
					return sanitize_email( $v );
				}
			}
		}
		return '';
	}

	/** @param array<int, array<string, mixed>> $values */
	private function index_values( array $values ): array {
		$out = [];
		foreach ( $values as $v ) {
			$out[ (string) ( $v['field_id'] ?? '' ) ] = (string) ( $v['field_value'] ?? '' );
		}
		return $out;
	}

	private function resolve_value( array $field, array $values_by_id ): string {
		$id = (string) ( $field['id'] ?? '' );
		return (string) ( $values_by_id[ $id ] ?? '' );
	}

	/**
	 * @return string[]
	 */
	private function collect_bound_post_types(): array {
		global $wpdb;
		$table = $wpdb->prefix . 'ff_forms';

		/* Conservative: scan only active forms; safe across small/medium sites. */
		$rows = $wpdb->get_col( "SELECT fields FROM {$table} WHERE status = 'active'" ); // phpcs:ignore
		if ( ! is_array( $rows ) ) {
			return [];
		}

		$post_types = [];
		foreach ( $rows as $raw ) {
			$fields = json_decode( (string) $raw, true );
			if ( ! is_array( $fields ) ) {
				continue;
			}
			foreach ( $this->iterate_fields( $fields ) as $field ) {
				$target    = $field['binding']['target']    ?? '';
				$post_type = $field['binding']['source']['post_type'] ?? '';
				if ( 'cpt' === $target && is_string( $post_type ) && '' !== $post_type ) {
					$post_types[ $post_type ] = true;
				}
			}
		}

		return array_keys( $post_types );
	}

	/** Generator over flat + row/col-nested fields. */
	private function iterate_fields( array $fields ): \Generator {
		foreach ( $fields as $f ) {
			if ( ! is_array( $f ) ) {
				continue;
			}
			if ( ( $f['type'] ?? '' ) === 'row' ) {
				foreach ( $f['cols'] ?? [] as $col ) {
					foreach ( $col['fields'] ?? [] as $child ) {
						yield $child;
					}
				}
				continue;
			}
			yield $f;
		}
	}

	private function log( string $message ): void {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( '[FormsPress Bindings] ' . $message );
		}
	}

	private function entries_have_post_id_column(): bool {
		static $cached = null;
		if ( null !== $cached ) {
			return $cached;
		}
		global $wpdb;
		$table  = $wpdb->prefix . 'ff_entries';
		$cached = (bool) $wpdb->get_var( $wpdb->prepare(
			'SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = %s AND table_name = %s AND column_name = %s',
			DB_NAME,
			$table,
			'post_id'
		) );
		return $cached;
	}
}
