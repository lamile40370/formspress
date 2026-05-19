<?php

namespace FlowForms;

use ReflectionClass;
use ReflectionNamedType;
use RuntimeException;

class Container {

	private array $bindings  = [];
	private array $factories = [];
	private array $instances = [];

	public function singleton( string $abstract, callable $factory ): void {
		$this->bindings[ $abstract ] = $factory;
	}

	public function bind( string $abstract, callable $factory ): void {
		$this->factories[ $abstract ] = $factory;
	}

	public function instance( string $abstract, mixed $instance ): void {
		$this->instances[ $abstract ] = $instance;
	}

	public function get( string $abstract ): mixed {
		if ( isset( $this->instances[ $abstract ] ) ) {
			return $this->instances[ $abstract ];
		}

		if ( isset( $this->bindings[ $abstract ] ) ) {
			$this->instances[ $abstract ] = ( $this->bindings[ $abstract ] )( $this );
			return $this->instances[ $abstract ];
		}

		if ( isset( $this->factories[ $abstract ] ) ) {
			return ( $this->factories[ $abstract ] )( $this );
		}

		return $this->autowire( $abstract );
	}

	public function make( string $abstract ): mixed {
		if ( isset( $this->bindings[ $abstract ] ) ) {
			return ( $this->bindings[ $abstract ] )( $this );
		}

		if ( isset( $this->factories[ $abstract ] ) ) {
			return ( $this->factories[ $abstract ] )( $this );
		}

		return $this->autowire( $abstract );
	}

	public function has( string $abstract ): bool {
		return isset( $this->bindings[ $abstract ] )
			|| isset( $this->factories[ $abstract ] )
			|| isset( $this->instances[ $abstract ] );
	}

	private function autowire( string $class ): mixed {
		if ( ! class_exists( $class ) ) {
			throw new RuntimeException( sprintf( 'Cannot auto-wire: class %s does not exist.', $class ) );
		}

		$reflection = new ReflectionClass( $class );

		if ( ! $reflection->isInstantiable() ) {
			throw new RuntimeException( sprintf( 'Cannot auto-wire: %s is not instantiable.', $class ) );
		}

		$constructor = $reflection->getConstructor();

		if ( null === $constructor ) {
			return new $class();
		}

		$args = [];

		foreach ( $constructor->getParameters() as $param ) {
			$type = $param->getType();

			if ( $type instanceof ReflectionNamedType && ! $type->isBuiltin() ) {
				$args[] = $this->get( $type->getName() );
			} elseif ( $param->isDefaultValueAvailable() ) {
				$args[] = $param->getDefaultValue();
			} else {
				throw new RuntimeException(
					sprintf( 'Cannot auto-wire parameter $%s in %s.', $param->getName(), $class )
				);
			}
		}

		return $reflection->newInstanceArgs( $args );
	}
}
