<?php

namespace FlowForms\Modules\Actions\Services\Actions;

use FlowForms\Modules\Actions\Services\AbstractAction;

class RedirectAction extends AbstractAction {

	public function get_id(): string {
		return 'redirect';
	}

	public function get_label(): string {
		return __( 'Redirect to URL', 'flowforms' );
	}

	public function get_icon(): string {
		return 'redo';
	}

	public function get_description(): string {
		return __( 'Override the form success action with a redirect.', 'flowforms' );
	}

	public function get_fields(): array {
		return [
			[
				'key'         => 'url',
				'type'        => 'url',
				'label'       => __( 'Redirect URL', 'flowforms' ),
				'placeholder' => 'https://…',
				'help'        => __( 'Overrides the form success action. Use {field:id} for dynamic URLs.', 'flowforms' ),
				'default'     => '',
			],
		];
	}

	public function run( array $config, array $entry, array $form ): void {
		// Redirect is handled client-side. This action stores the redirect URL
		// in form settings and returns it via the submit endpoint response.
		// Nothing to do server-side at entry processing time.
	}
}
