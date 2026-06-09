<?php

namespace FlowForms\Extensibility\Validators\Types;

use FlowForms\Extensibility\Validators\AbstractValidator;

class EmailDnsValidator extends AbstractValidator {

	public function get_id(): string {
		return 'email_dns';
	}

	public function get_label(): string {
		return __( 'Email DNS check', 'formspress' );
	}

	public function get_description(): string {
		return __( 'Verify the email domain has MX records.', 'formspress' );
	}

	public function validate( mixed $value, array $config, array $field ): true|string {
		if ( $value === '' || $value === null ) {
			return true;
		}
		if ( ! is_email( $value ) ) {
			return __( 'Please enter a valid email address.', 'formspress' );
		}
		$parts = explode( '@', (string) $value );
		if ( count( $parts ) !== 2 ) {
			return __( 'Please enter a valid email address.', 'formspress' );
		}
		$domain = $parts[1];
		if ( ! function_exists( 'checkdnsrr' ) ) {
			return true;
		}
		if ( ! checkdnsrr( $domain, 'MX' ) && ! checkdnsrr( $domain, 'A' ) ) {
			return __( 'Email domain does not exist.', 'formspress' );
		}
		return true;
	}
}
