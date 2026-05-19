<?php

namespace FlowForms\Modules\Actions\Services\Actions;

use FlowForms\Modules\Actions\Services\AbstractAction;
use FlowForms\Modules\EmailTemplates\Services\EmailRenderer;
use FlowForms\Modules\EmailTemplates\Services\EmailTemplateRepository;

class EmailAction extends AbstractAction {

	public function get_id(): string {
		return 'email';
	}

	public function get_label(): string {
		return __( 'Send Email Notification', 'flowforms' );
	}

	public function get_icon(): string {
		return 'email';
	}

	public function get_description(): string {
		return __( 'Send a notification email when the form is submitted.', 'flowforms' );
	}

	public function get_fields(): array {
		return [
			[
				'key'         => 'to',
				'type'        => 'text',
				'label'       => __( 'Send to', 'flowforms' ),
				'help'        => __( 'Use {field:id} for dynamic values', 'flowforms' ),
				'default'     => '',
			],
			[
				'key'     => 'subject',
				'type'    => 'text',
				'label'   => __( 'Subject', 'flowforms' ),
				'default' => '',
			],
			[
				'key'     => 'body',
				'type'    => 'email-designer',
				'label'   => __( 'Body', 'flowforms' ),
				'help'    => __( 'Use [entry_table] to inject the auto-generated entry table.', 'flowforms' ),
				'default' => '',
			],
			[
				'key'     => 'template_id',
				'type'    => 'email-template-picker',
				'label'   => __( 'Load template', 'flowforms' ),
				'default' => 0,
			],
			[
				'key'         => 'from_name',
				'type'        => 'text',
				'label'       => __( 'From name', 'flowforms' ),
				'placeholder' => '',
				'default'     => '',
			],
			[
				'key'         => 'from_email',
				'type'        => 'text',
				'label'       => __( 'From email', 'flowforms' ),
				'placeholder' => '',
				'default'     => '',
			],
			[
				'key'         => 'reply_to',
				'type'        => 'text',
				'label'       => __( 'Reply-To', 'flowforms' ),
				'placeholder' => '{field:email}',
				'default'     => '',
			],
			[
				'key'         => 'confirmation_to',
				'type'        => 'text',
				'label'       => __( 'Confirmation email to', 'flowforms' ),
				'placeholder' => '{field:email}',
				'help'        => __( 'Optional. Sends a copy to the submitter.', 'flowforms' ),
				'default'     => '',
			],
		];
	}

	public function run( array $config, array $entry, array $form ): void {
		$global_settings    = get_option( 'flowforms_settings', [] );
		$default_from_name  = $global_settings['default_from_name']  ?? get_bloginfo( 'name' );
		$default_from_email = $global_settings['default_from_email'] ?? get_option( 'admin_email' );

		$to      = $this->resolve_variables( $config['to'] ?? get_option( 'admin_email' ), $entry, $form );
		$subject = $this->resolve_variables( $config['subject'] ?? sprintf( __( 'New submission: %s', 'flowforms' ), $form['title'] ), $entry, $form );

		$raw_body = (string) ( $config['body'] ?? '' );

		/* Replace [entry_table] token with auto-generated table. */
		if ( '' === trim( $raw_body ) ) {
			$raw_body = sprintf(
				'<p>%s</p>[entry_table]',
				sprintf( __( 'New entry received for: %s', 'flowforms' ), esc_html( $form['title'] ) )
			);
		}

		$raw_body = str_replace( '[entry_table]', $this->build_entry_html( $entry ), $raw_body );
		$body     = $this->resolve_variables( $raw_body, $entry, $form );

		/* Wrap with responsive shell unless author provided a full document. */
		if ( class_exists( EmailRenderer::class ) && ! EmailRenderer::is_full_document( $body ) ) {
			$body = EmailRenderer::wrap( $body, $form );
		}

		$headers = [ 'Content-Type: text/html; charset=UTF-8' ];

		if ( ! empty( $config['reply_to'] ) ) {
			$reply_to  = $this->resolve_variables( $config['reply_to'], $entry, $form );
			$headers[] = 'Reply-To: ' . sanitize_email( $reply_to );
		}

		$from_name  = $this->resolve_variables( ! empty( $config['from_name'] )  ? (string) $config['from_name']  : (string) $default_from_name,  $entry, $form );
		$from_email = $this->resolve_variables( ! empty( $config['from_email'] ) ? (string) $config['from_email'] : (string) $default_from_email, $entry, $form );

		if ( is_email( $from_email ) ) {
			$headers[] = 'From: ' . sanitize_text_field( $from_name ) . ' <' . sanitize_email( $from_email ) . '>';
		}

		wp_mail( sanitize_email( $to ), sanitize_text_field( $subject ), $body, $headers );

		if ( ! empty( $config['confirmation_to'] ) ) {
			$this->send_confirmation( $config, $entry, $form );
		}
	}

	private function send_confirmation( array $config, array $entry, array $form ): void {
		$to      = $this->resolve_variables( $config['confirmation_to'], $entry, $form );
		$subject = $this->resolve_variables( $config['confirmation_subject'] ?? __( 'Thank you for your submission!', 'flowforms' ), $entry, $form );
		$body    = $this->resolve_variables( $config['confirmation_body'] ?? $form['settings']['success_message'] ?? '', $entry, $form );

		if ( class_exists( EmailRenderer::class ) && ! EmailRenderer::is_full_document( $body ) ) {
			$body = EmailRenderer::wrap( $body, $form );
		}

		if ( is_email( $to ) ) {
			wp_mail( $to, sanitize_text_field( $subject ), $body, [ 'Content-Type: text/html; charset=UTF-8' ] );
		}
	}
}
