<?php

namespace FlowForms\Extensibility\Validators\Types;

use FlowForms\Extensibility\Validators\AbstractValidator;

class FileSizeValidator extends AbstractValidator {

	public function get_id(): string {
		return 'file_size';
	}

	public function get_label(): string {
		return __( 'Maximum file size', 'flowforms' );
	}

	public function get_settings_schema(): array {
		return [
			[ 'key' => 'max_mb', 'type' => 'number', 'label' => __( 'Max size (MB)', 'flowforms' ), 'default' => 5, 'min' => 1 ],
		];
	}

	public function validate( mixed $value, array $config, array $field ): true|string {
		if ( $value === '' || $value === null || ! is_array( $value ) ) {
			return true;
		}
		$max_mb = (float) ( $config['max_mb'] ?? 5 );
		$size   = (int) ( $value['size'] ?? 0 );
		$limit  = (int) ( $max_mb * 1024 * 1024 );

		if ( $size > $limit ) {
			return sprintf(
				/* translators: %s is max size in MB */
				__( 'File must be smaller than %s MB.', 'flowforms' ),
				$max_mb
			);
		}
		return true;
	}
}
