<?php

namespace FlowForms\Modules\Actions;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Modules\Actions\Services\ActionRegistry;
use FlowForms\Modules\Actions\Services\ActionRunner;

class ActionsModule extends AbstractModule {

	public function get_id(): string {
		return 'actions';
	}

	public function get_name(): string {
		return __( 'Actions', 'formspress' );
	}

	public function register_services( Container $container ): void {
		$container->singleton( ActionRegistry::class, fn() => new ActionRegistry() );
		$container->singleton(
			ActionRunner::class,
			fn( Container $c ) => new ActionRunner( $c->get( ActionRegistry::class ) )
		);
	}

	public function get_routes(): ?string {
		return Routes::class;
	}
}
