<?php

namespace FlowForms\Modules\Actions\Services\Actions;

use FlowForms\Modules\Actions\Services\AbstractAction;

class EmailAction extends AbstractAction {

	public function get_id(): string {
		return 'email';
	}

	public function get_label(): string {
		return __( 'Send Email Notification', 'formspress' );
	}

	public function get_icon(): string {
		return 'email';
	}

	public function get_description(): string {
		return __( 'Send a notification email when the form is submitted.', 'formspress' );
	}

	public function get_fields(): array {
		return [
			[
				'key'     => 'recipient_config',
				'type'    => 'send-to-routing',
				'label'   => __( 'Send to', 'formspress' ),
				'default' => '',
			],
			[
				'key'     => 'subject',
				'type'    => 'text',
				'label'   => __( 'Subject', 'formspress' ),
				'default' => '',
			],
			[
				'key'     => 'body',
				'type'    => 'email-designer',
				'label'   => __( 'Body', 'formspress' ),
				'help'    => __( 'Use [entry_table] to inject the auto-generated entry table.', 'formspress' ),
				'default' => '',
			],
			[
				'key'         => 'from_name',
				'type'        => 'text',
				'label'       => __( 'From name', 'formspress' ),
				'placeholder' => '',
				'default'     => '',
			],
			[
				'key'         => 'from_email',
				'type'        => 'text',
				'label'       => __( 'From email', 'formspress' ),
				'placeholder' => '',
				'default'     => '',
			],
			[
				'key'         => 'reply_to',
				'type'        => 'text',
				'label'       => __( 'Reply-To', 'formspress' ),
				'placeholder' => '{field:email}',
				'default'     => '',
			],
			[
				'key'         => 'confirmation_to',
				'type'        => 'text',
				'label'       => __( 'Confirmation email to', 'formspress' ),
				'placeholder' => '{field:email}',
				'help'        => __( 'Optional. Sends a copy to the submitter.', 'formspress' ),
				'default'     => '',
			],
		];
	}

	public function run( array $config, array $entry, array $form ): void {
		$global_settings    = get_option( 'flowforms_settings', [] );
		$default_from_name  = $global_settings['default_from_name']  ?? get_bloginfo( 'name' );
		$default_from_email = $global_settings['default_from_email'] ?? get_option( 'admin_email' );
		$default_reply_to   = $global_settings['default_reply_to'] ?? '';
		$default_to         = $global_settings['default_notification_to'] ?? get_option( 'admin_email' );

		$recipients = $this->resolve_recipients( $config, $entry, $form, (string) $default_to );
		$subject = $this->resolve_variables( $config['subject'] ?? sprintf( __( 'New submission: %s', 'formspress' ), $form['title'] ), $entry, $form );

		$raw_body = (string) ( $config['body'] ?? '' );

		/* Replace [entry_table] token with auto-generated table. */
		if ( '' === trim( $raw_body ) ) {
			$raw_body = sprintf(
				'<p>%s</p>[entry_table]',
				sprintf( __( 'New entry received for: %s', 'formspress' ), esc_html( $form['title'] ) )
			);
		}

		$raw_body = str_replace( '[entry_table]', $this->build_entry_html( $entry ), $raw_body );
		$body     = $this->resolve_variables( $raw_body, $entry, $form );

		/* Wrap with responsive shell unless author provided a full document. */
		$body = apply_filters( 'flowforms_email_body', $body, $form, $entry, $config );

		$headers = [ 'Content-Type: text/html; charset=UTF-8' ];

		$reply_to_config = ! empty( $config['reply_to'] ) ? $config['reply_to'] : $default_reply_to;
		if ( ! empty( $reply_to_config ) ) {
			$reply_to  = $this->resolve_variables( $reply_to_config, $entry, $form );
			$headers[] = 'Reply-To: ' . sanitize_email( $reply_to );
		}

		$from_name  = $this->resolve_variables( ! empty( $config['from_name'] )  ? (string) $config['from_name']  : (string) $default_from_name,  $entry, $form );
		$from_email = $this->resolve_variables( ! empty( $config['from_email'] ) ? (string) $config['from_email'] : (string) $default_from_email, $entry, $form );

		if ( is_email( $from_email ) ) {
			$headers[] = 'From: ' . sanitize_text_field( $from_name ) . ' <' . sanitize_email( $from_email ) . '>';
		}

		if ( ! empty( $recipients ) ) {
			wp_mail( $recipients, sanitize_text_field( $subject ), $body, $headers );
		}

		if ( ! empty( $config['confirmation_to'] ) ) {
			$this->send_confirmation( $config, $entry, $form );
		}
	}

	private function send_confirmation( array $config, array $entry, array $form ): void {
		$global_settings    = get_option( 'flowforms_settings', [] );
		$default_from_name  = $global_settings['default_from_name'] ?? get_bloginfo( 'name' );
		$default_from_email = $global_settings['default_from_email'] ?? get_option( 'admin_email' );
		$default_reply_to   = $global_settings['default_reply_to'] ?? '';

		$to      = $this->resolve_variables( $config['confirmation_to'], $entry, $form );
		$subject = $this->resolve_variables( $config['confirmation_subject'] ?? __( 'Thank you for your submission!', 'formspress' ), $entry, $form );
		$body    = $this->resolve_variables( $config['confirmation_body'] ?? $form['settings']['success_message'] ?? '', $entry, $form );

		$body = apply_filters( 'flowforms_confirmation_email_body', $body, $form, $entry, $config );

		$headers = [ 'Content-Type: text/html; charset=UTF-8' ];
		$from_name = $this->resolve_variables( ! empty( $config['from_name'] ) ? (string) $config['from_name'] : (string) $default_from_name, $entry, $form );
		$from_email = $this->resolve_variables( ! empty( $config['from_email'] ) ? (string) $config['from_email'] : (string) $default_from_email, $entry, $form );
		$reply_to_config = ! empty( $config['reply_to'] ) ? $config['reply_to'] : $default_reply_to;

		if ( is_email( $from_email ) ) {
			$headers[] = 'From: ' . sanitize_text_field( $from_name ) . ' <' . sanitize_email( $from_email ) . '>';
		}

		if ( ! empty( $reply_to_config ) ) {
			$reply_to = $this->resolve_variables( $reply_to_config, $entry, $form );
			$headers[] = 'Reply-To: ' . sanitize_email( $reply_to );
		}

		if ( is_email( $to ) ) {
			wp_mail( $to, sanitize_text_field( $subject ), $body, $headers );
		}
	}

	/**
	 * @return array<int,string>
	 */
	private function resolve_recipients( array $config, array $entry, array $form, string $default_to ): array {
		$mode = $config['to_mode'] ?? '';

		if ( '' === $mode ) {
			$mode = ! empty( $config['routing'] ) ? 'routing' : ( ! empty( $config['to_field'] ) ? 'field' : 'email' );
		}

		$recipients = [];

		if ( 'routing' === $mode ) {
			$entry_values = $this->entry_values_by_field( $entry );

			foreach ( $config['routing'] ?? [] as $route ) {
				if ( ! is_array( $route ) || ! $this->routing_rule_matches( $route, $entry_values ) ) {
					continue;
				}

				$recipients = array_merge(
					$recipients,
					$this->normalize_email_list( $this->resolve_variables( (string) ( $route['to'] ?? '' ), $entry, $form ) )
				);
			}
		} elseif ( 'field' === $mode ) {
			$recipients = $this->normalize_email_list( $this->get_field_value( (string) ( $config['to_field'] ?? '' ), $entry ) );
		} else {
			$recipients = $this->normalize_email_list( $this->resolve_variables( (string) ( $config['to'] ?? '' ), $entry, $form ) );
		}

		if ( empty( $recipients ) ) {
			$recipients = $this->normalize_email_list( $this->resolve_variables( $default_to, $entry, $form ) );
		}

		return array_values( array_unique( $recipients ) );
	}

	/**
	 * @return array<int,string>
	 */
	private function normalize_email_list( string $raw ): array {
		$emails = preg_split( '/[,;\s]+/', $raw );

		if ( ! is_array( $emails ) ) {
			return [];
		}

		return array_values(
			array_filter(
				array_map(
					static fn( string $email ): string => sanitize_email( $email ),
					$emails
				),
				static fn( string $email ): bool => is_email( $email )
			)
		);
	}

	/**
	 * @return array<string,string>
	 */
	private function entry_values_by_field( array $entry ): array {
		$values = [];

		foreach ( $entry['values'] ?? [] as $value ) {
			$field_id = (string) ( $value['field_id'] ?? '' );
			if ( '' === $field_id ) {
				continue;
			}

			$field_value = $value['field_value'] ?? '';
			$values[ $field_id ] = is_array( $field_value )
				? implode( ', ', array_map( 'strval', $field_value ) )
				: (string) $field_value;
		}

		return $values;
	}

	/**
	 * @param array<string,string> $entry_values
	 */
	private function routing_rule_matches( array $route, array $entry_values ): bool {
		$field    = (string) ( $route['field'] ?? '' );
		$operator = (string) ( $route['operator'] ?? 'is' );
		$expected = (string) ( $route['value'] ?? '' );
		$actual   = $entry_values[ $field ] ?? '';

		return match ( $operator ) {
			'is'           => $actual === $expected,
			'is_not'       => $actual !== $expected,
			'contains'     => '' !== $expected && false !== stripos( $actual, $expected ),
			'not_contains' => '' === $expected || false === stripos( $actual, $expected ),
			'is_empty'     => '' === trim( $actual ),
			'not_empty'    => '' !== trim( $actual ),
			default        => false,
		};
	}
}
