<?php

namespace FlowForms\Modules\Entries;

use FlowForms\Container;
use FlowForms\Core\AbstractModule;
use FlowForms\Modules\Entries\Services\Conditional\ConditionEvaluator;
use FlowForms\Modules\Entries\Services\EntryDraftRepository;
use FlowForms\Modules\Entries\Services\EntryProcessor;
use FlowForms\Modules\Entries\Services\EntryRepository;

class EntriesModule extends AbstractModule {

	public function get_id(): string {
		return 'entries';
	}

	public function get_name(): string {
		return __( 'Entries', 'flowforms' );
	}

	public function register_services( Container $container ): void {
		$container->singleton( EntryRepository::class, fn() => new EntryRepository() );
		$container->singleton( EntryDraftRepository::class, fn() => new EntryDraftRepository() );
		$container->singleton( ConditionEvaluator::class, fn() => new ConditionEvaluator() );
		$container->singleton(
			EntryProcessor::class,
			fn( Container $c ) => new EntryProcessor(
				$c->get( \FlowForms\Modules\Forms\Services\FormRepository::class ),
				$c->get( EntryRepository::class ),
				$c->get( \FlowForms\Modules\Actions\Services\ActionRunner::class ),
				$c->get( ConditionEvaluator::class ),
				$c->get( \FlowForms\Extensibility\FieldTypes\FieldTypeRegistry::class ),
				$c->get( \FlowForms\Extensibility\Validators\ValidatorRegistry::class ),
				$c->get( \FlowForms\Extensibility\SpamProviders\SpamProviderRegistry::class )
			)
		);
	}

	public function get_routes(): ?string {
		return Routes::class;
	}

	public function get_migrations_path(): ?string {
		return __DIR__ . '/Migrations';
	}

	public function get_nav_items(): array {
		return [
			[
				'label'       => __( 'Submissions', 'flowforms' ),
				'path'        => '/entries',
				'icon'        => 'post-list',
				'position'    => 30,
				'description' => __( 'Browse and export every submission across your forms.', 'flowforms' ),
				'children'    => [
					[
						'label' => __( 'All submissions', 'flowforms' ),
						'path'  => '/entries',
						'icon'  => 'post-list',
					],
					[
						'label' => __( 'Exports', 'flowforms' ),
						'path'  => '/entries/exports',
						'icon'  => 'list-view',
					],
				],
			],
		];
	}
}
