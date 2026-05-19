<?php

namespace FlowForms\Modules\Actions\Services;

use FlowForms\Modules\Actions\Services\Actions\EmailAction;
use FlowForms\Modules\Actions\Services\Actions\RedirectAction;
use FlowForms\Modules\Actions\Services\Actions\StripePaymentAction;
use FlowForms\Modules\Actions\Services\Actions\WebhookAction;
use FlowForms\Modules\Actions\Services\Actions\Integrations\ActiveCampaignAction;
use FlowForms\Modules\Actions\Services\Actions\Integrations\BrevoAction;
use FlowForms\Modules\Actions\Services\Actions\Integrations\ConvertKitAction;
use FlowForms\Modules\Actions\Services\Actions\Integrations\HubSpotAction;
use FlowForms\Modules\Actions\Services\Actions\Integrations\MailchimpAction;
use FlowForms\Modules\Actions\Services\Actions\Integrations\MailerPressAction;

class ActionRegistry {

	/** @var AbstractAction[] */
	private array $actions = [];

	public function __construct() {
		$this->register( new EmailAction() );
		$this->register( new WebhookAction() );
		$this->register( new RedirectAction() );
		$this->register( new StripePaymentAction() );
		$this->register( new MailchimpAction() );
		$this->register( new ConvertKitAction() );
		$this->register( new ActiveCampaignAction() );
		$this->register( new HubSpotAction() );
		$this->register( new BrevoAction() );
		$this->register( new MailerPressAction() );

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
