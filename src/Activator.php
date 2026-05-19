<?php

namespace FlowForms;

use FlowForms\Core\MigrationRunner;

class Activator {

	public static function activate(): void {
		if ( file_exists( FLOWFORMS_DIR . 'vendor/autoload.php' ) ) {
			require_once FLOWFORMS_DIR . 'vendor/autoload.php';
		}

		$runner = new MigrationRunner( self::get_migration_paths() );
		$runner->run_pending();

		update_option( 'flowforms_version', FLOWFORMS_VERSION );

		flush_rewrite_rules();
	}

	private static function get_migration_paths(): array {
		$modules_dir = FLOWFORMS_DIR . 'src/Modules';
		$paths       = [];

		if ( ! is_dir( $modules_dir ) ) {
			return $paths;
		}

		$dirs = glob( $modules_dir . '/*/Migrations', GLOB_ONLYDIR );

		if ( $dirs ) {
			$paths = $dirs;
		}

		return $paths;
	}
}
