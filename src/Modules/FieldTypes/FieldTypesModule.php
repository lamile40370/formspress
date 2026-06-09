<?php

namespace FlowForms\Modules\FieldTypes;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Extensibility\FieldTypes\FieldTypeRegistry;
use FlowForms\Extensibility\Validators\ValidatorRegistry;

class FieldTypesModule extends AbstractModule {

	public function get_id(): string {
		return 'field_types';
	}

	public function get_name(): string {
		return __( 'Field Types', 'formspress' );
	}

	public function register_services( Container $container ): void {
		$container->singleton( FieldTypeRegistry::class, fn() => new FieldTypeRegistry() );
		$container->singleton( ValidatorRegistry::class, fn() => new ValidatorRegistry() );
	}

	public function get_routes(): ?string {
		return Routes::class;
	}
}
