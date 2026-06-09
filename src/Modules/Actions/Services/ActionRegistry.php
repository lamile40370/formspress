<?php

namespace FlowForms\Modules\Actions\Services;

use FlowForms\Modules\Actions\Services\Actions\EmailAction;

class ActionRegistry {

	/** @var AbstractAction[] */
	private array $actions = [];

	public function __construct() {
		$this->register( new EmailAction() );

		/**
		 * Allow third-party plugins to register their own FormsPress actions.
		 *
		 * Example:
		 *     add_action( 'flowforms_register_actions', function ( $registry ) {
		 *         $registry->register( new \MyPlugin\SlackAction() );
		 *     } );
		 *
		 * @param ActionRegistry $registry The action registry instance.
		 */
		do_action( 'flowforms_register_actions', $this );
	}

	public function register( AbstractAction $action ): void {
		$this->actions[ $action->get_id() ] = $action;
	}

	public function get( string $id ): ?AbstractAction {
		return $this->actions[ $id ] ?? null;
	}

	/** @return AbstractAction[] */
	public function all(): array {
		return $this->actions;
	}

	public function get_schema(): array {
		return array_values( array_map(
			fn( AbstractAction $action ) => [
				'id'          => $action->get_id(),
				'label'       => $action->get_label(),
				'icon'        => $action->get_icon(),
				'description' => $action->get_description(),
				'fields'      => $action->get_fields(),
			],
			$this->actions
		) );
	}
}
