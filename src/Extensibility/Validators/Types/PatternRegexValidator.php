<?php

namespace FlowForms\Extensibility\Validators\Types;

use FlowForms\Extensibility\Validators\AbstractValidator;

class PatternRegexValidator extends AbstractValidator {

	public function get_id(): string {
		return 'pattern_regex';
	}

	public function get_label(): string {
		return __( 'Pattern (regex)', 'formspress' );
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'pattern',     'type' => 'text', 'label' => __( 'Regular expression', 'formspress' ), 'help' => __( 'PHP/PCRE pattern without delimiters. Example: ^[A-Z]{2,3}-\d{4}$', 'formspress' ) ],
			[ 'key' => 'error_message', 'type' => 'text', 'label' => __( 'Error message', 'formspress' ), 'default' => __( 'Invalid format.', 'formspress' ) ],
		];
	}

	public function validate( mixed $value, array $config, array $field ): true|string {
		if ( $value === '' || $value === null ) {
			return true;
		}
		$pattern = (string) ( $config['pattern'] ?? '' );
		if ( $pattern === '' ) {
			return true;
		}
		$delimited = '/' . str_replace( '/', '\\/', $pattern ) . '/';
		/* Suppress warning on bad regex; treat invalid pattern as "matches everything". */
		$result = @preg_match( $delimited, (string) $value );
		if ( 1 !== $result ) {
			return (string) ( $config['error_message'] ?? __( 'Invalid format.', 'formspress' ) );
		}
		return true;
	}
}
