<?php

namespace FlowForms\Modules\Bindings;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Modules\Bindings\Services\BindingProcessor;
use FlowForms\Modules\Bindings\Services\BindingSourceRegistry;
use FlowForms\Modules\Entries\Services\Conditional\ConditionEvaluator;
use FlowForms\Modules\Forms\Services\FormRepository;

/**
 * Block Bindings integration — used BACKWARDS: form fields act as
 * a DATA SINK that, on submission, can write values into CPTs,
 * post_meta, user_meta, or options.
 *
 * Also exposes a forward Block Bindings SOURCE so any Gutenberg block
 * can read from FormsPress-written options (e.g. show "last subscriber
 * email" in a paragraph via `formspress/option`).
 */
class BindingsModule extends AbstractModule {

	public function get_id(): string {
		return 'bindings';
	}

	public function get_name(): string {
		return __( 'Bindings', 'formspress' );
	}

	public function register_services( Container $container ): void {
		$container->singleton( BindingSourceRegistry::class, fn() => new BindingSourceRegistry() );

		$container->singleton(
			BindingProcessor::class,
			fn( Container $c ) => new BindingProcessor(
				$c->get( FormRepository::class ),
				$c->get( ConditionEvaluator::class ),
				$c->get( BindingSourceRegistry::class ),
			)
		);
	}

	public function get_migrations_path(): ?string {
		return __DIR__ . '/Migrations';
	}

	public function boot(): void {
		/* Wire sink: process bindings on each new entry. */
		$processor = \FlowForms\Plugin::instance()->container()->get( BindingProcessor::class );
		$processor->boot();

		/* Wire source: register a Block Bindings SOURCE so Gutenberg
		 * blocks can read values that the form has written to options. */
		add_action( 'init', [ $this, 'register_block_bindings_source' ], 20 );
	}

	/**
	 * Register `formspress/option` block bindings source so any
	 * paragraph / heading / image-alt etc. can be bound to a
	 * FormsPress-written option key.
	 *
	 *   <!-- wp:paragraph { "metadata": {
	 *       "bindings": { "content": {
	 *           "source": "formspress/option",
	 *           "args": { "key": "last_signup_email" }
	 *       } }
	 *   } } -->
	 */
	public function register_block_bindings_source(): void {
		if ( ! function_exists( 'register_block_bindings_source' ) ) {
			return;
		}

		register_block_bindings_source( 'formspress/option', [
			'label'              => __( 'FormsPress option', 'formspress' ),
			'get_value_callback' => static function ( array $source_args ): string {
				$key = sanitize_key( $source_args['key'] ?? '' );
				if ( '' === $key ) {
					return '';
				}
				$value = get_option( $key, '' );
				return is_scalar( $value ) ? (string) $value : '';
			},
			'uses_context'       => [],
		] );
	}
}
