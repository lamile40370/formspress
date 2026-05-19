<?php

namespace FlowForms\Hooks;

use ReflectionClass;
use ReflectionMethod;
use FlowForms\Container;
use FlowForms\Contracts\HookSubscriberInterface;
use FlowForms\Hooks\Attributes\Action;
use FlowForms\Hooks\Attributes\Filter;

class HookRegistry {

	private array $subscribers = [];

	public function __construct(
		private readonly Container $container,
	) {}

	public function register( string $subscriber_class ): void {
		if ( isset( $this->subscribers[ $subscriber_class ] ) ) {
			return;
		}

		$instance                                   = $this->container->get( $subscriber_class );
		$this->subscribers[ $subscriber_class ] = $instance;

		$this->register_attribute_hooks( $instance );

		if ( $instance instanceof HookSubscriberInterface ) {
			$this->register_interface_hooks( $instance );
		}
	}

	private function register_attribute_hooks( object $instance ): void {
		$reflection = new ReflectionClass( $instance );

		foreach ( $reflection->getMethods( ReflectionMethod::IS_PUBLIC ) as $method ) {
			foreach ( $method->getAttributes( Action::class ) as $attr ) {
				$action = $attr->newInstance();
				add_action( $action->hook, [ $instance, $method->getName() ], $action->priority, $action->accepted_args );
			}

			foreach ( $method->getAttributes( Filter::class ) as $attr ) {
				$filter = $attr->newInstance();
				add_filter( $filter->hook, [ $instance, $method->getName() ], $filter->priority, $filter->accepted_args );
			}
		}
	}

	private function register_interface_hooks( HookSubscriberInterface $instance ): void {
		foreach ( $instance::get_subscribed_hooks() as $hook_def ) {
			$type          = $hook_def['type'] ?? 'action';
			$hook          = $hook_def['hook'];
			$method        = $hook_def['method'];
			$priority      = $hook_def['priority'] ?? 10;
			$accepted_args = $hook_def['accepted_args'] ?? 1;

			$callback = [ $instance, $method ];

			if ( 'filter' === $type ) {
				add_filter( $hook, $callback, $priority, $accepted_args );
			} else {
				add_action( $hook, $callback, $priority, $accepted_args );
			}
		}
	}
}
