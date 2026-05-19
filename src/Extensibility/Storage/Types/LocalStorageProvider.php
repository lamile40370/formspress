<?php

namespace FlowForms\Extensibility\Storage\Types;

use FlowForms\Extensibility\Storage\AbstractStorageProvider;

class LocalStorageProvider extends AbstractStorageProvider {

	public function get_id(): string {
		return 'local';
	}

	public function get_label(): string {
		return __( 'Local uploads folder', 'flowforms' );
	}

	public function get_settings_schema(): array {
		return [];
	}

	public function store( array $uploaded_file, array $form, array $config ): array {
		if ( ! function_exists( 'wp_handle_upload' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		$upload_dir = wp_upload_dir();
		$ff_subdir  = '/flowforms';
		$target_dir = $upload_dir['basedir'] . $ff_subdir;
		$target_url = $upload_dir['baseurl'] . $ff_subdir;

		if ( ! is_dir( $target_dir ) ) {
			wp_mkdir_p( $target_dir );
		}

		/* Custom upload dir filter for wp_handle_upload to redirect into flowforms/. */
		$override = function ( $dirs ) use ( $target_dir, $target_url, $ff_subdir ) {
			$dirs['path']   = $target_dir;
			$dirs['url']    = $target_url;
			$dirs['subdir'] = $ff_subdir;
			return $dirs;
		};

		add_filter( 'upload_dir', $override );

		$result = wp_handle_upload( $uploaded_file, [
			'test_form' => false,
			'unique_filename_callback' => null,
		] );

		remove_filter( 'upload_dir', $override );

		if ( isset( $result['error'] ) ) {
			throw new \RuntimeException( esc_html( $result['error'] ) );
		}

		return [
			'url'  => (string) ( $result['url']  ?? '' ),
			'path' => (string) ( $result['file'] ?? '' ),
			'size' => (int) ( $uploaded_file['size'] ?? 0 ),
			'mime' => (string) ( $result['type'] ?? $uploaded_file['type'] ?? '' ),
		];
	}

	public function delete( string $path, array $config ): bool {
		if ( $path === '' || ! file_exists( $path ) ) {
			return false;
		}
		/* Safety: only allow deletion within wp uploads. */
		$upload_dir = wp_upload_dir();
		if ( ! str_starts_with( $path, $upload_dir['basedir'] ) ) {
			return false;
		}
		return @unlink( $path );
	}
}
