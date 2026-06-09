<?php

namespace FlowForms\Extensibility\Validators\Types;

use FlowForms\Extensibility\Validators\AbstractValidator;

class FileTypeValidator extends AbstractValidator {

	public function get_id(): string {
		return 'file_type';
	}

	public function get_label(): string {
		return __( 'Allowed file types', 'formspress' );
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'extensions', 'type' => 'text', 'label' => __( 'Allowed extensions', 'formspress' ), 'placeholder' => 'jpg,png,pdf', 'help' => __( 'Comma-separated list, no leading dots.', 'formspress' ) ],
		];
	}

	public function validate( mixed $value, array $config, array $field ): true|string {
		if ( $value === '' || $value === null || ! is_array( $value ) ) {
			return true;
		}
		$exts_raw = (string) ( $config['extensions'] ?? '' );
		if ( $exts_raw === '' ) {
			return true;
		}
		$allowed = array_map( 'trim', explode( ',', strtolower( $exts_raw ) ) );

		$file_name = (string) ( $value['name'] ?? '' );
		$ext       = strtolower( pathinfo( $file_name, PATHINFO_EXTENSION ) );

		if ( $ext === '' || ! in_array( $ext, $allowed, true ) ) {
			return sprintf(
				/* translators: %s is comma-separated extensions */
				__( 'Allowed file types: %s.', 'formspress' ),
				$exts_raw
			);
		}
		return true;
	}
}
