<?php

namespace FlowForms\Modules\Bindings\Services;

/**
 * Registry for custom field-binding TARGETS — destinations where
 * submitted values can be persisted (in addition to the entry row).
 *
 * Built-in targets: cpt, post_meta, user_meta, option, none.
 *
 * Plugins extend FormsPress by registering handlers under their own
 * target id, e.g. an "akismet" target that pushes the value into the
 * Akismet API rather than saving anywhere.
 *
 *     add_action( 'flowforms_register_binding_targets', function ( $registry ) {
 *         $registry->register( 'akismet', new MyAkismetBinding() );
 *     } );
 */
class BindingSourceRegistry {

	/** @var array<string, callable|object> id => handler */
	private array $handlers = [];

	private bool $booted = false;

	public function boot(): void {
		if ( $this->booted ) {
			return;
		}
		$this->booted = true;
		do_action( 'flowforms_register_binding_targets', $this );
	}

	/**
	 * Register a custom binding-target handler.
	 *
	 * The handler must be either:
	 *  - a callable: fn( string $value, array $source, array $field, array $entry, array $context ): void
	 *  - an object with a public `handle( $value, $source, $field, $entry, $context )` method.
	 */
	public function register( string $id, callable|object $handler ): void {
		$id = sanitize_key( $id );
		if ( '' === $id ) {
			return;
		}
		$this->handlers[ $id ] = $handler;
	}

	public function has( string $id ): bool {
		$this->boot();
		return isset( $this->handlers[ $id ] );
	}

	public function get( string $id ): callable|object|null {
		$this->boot();
		return $this->handlers[ $id ] ?? null;
	}

	/** @return string[] */
	public function get_ids(): array {
		$this->boot();
		return array_keys( $this->handlers );
	}
}
