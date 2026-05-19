<?php

namespace FlowForms\Core;

class MigrationRunner {

	private string $migrations_table;
	private array $migration_paths = [];

	public function __construct( array $migration_paths = [] ) {
		global $wpdb;
		$this->migrations_table = $wpdb->prefix . 'ff_migrations';
		$this->migration_paths  = $migration_paths;
	}

	public function run_pending(): void {
		$this->ensure_migrations_table();

		$executed = $this->get_executed_migrations();
		$all      = $this->discover_migrations();
		$pending  = array_diff_key( $all, array_flip( $executed ) );

		if ( empty( $pending ) ) {
			return;
		}

		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$batch = (int) $wpdb->get_var( "SELECT MAX(batch) FROM {$this->migrations_table}" ) + 1;

		foreach ( $pending as $name => $file ) {
			require_once $file;

			$class_name = $this->filename_to_classname( $name );
			$migration  = $this->resolve_migration_class( $class_name );

			if ( $migration instanceof AbstractMigration ) {
				$migration->up();

				$wpdb->insert(
					$this->migrations_table,
					[
						'migration'   => $name,
						'batch'       => $batch,
						'executed_at' => current_time( 'mysql' ),
					],
					[ '%s', '%d', '%s' ]
				);
			}
		}
	}

	public function rollback(): void {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$batch = (int) $wpdb->get_var( "SELECT MAX(batch) FROM {$this->migrations_table}" );

		if ( $batch < 1 ) {
			return;
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$migrations = $wpdb->get_results(
			$wpdb->prepare( "SELECT * FROM {$this->migrations_table} WHERE batch = %d ORDER BY id DESC", $batch )
		);

		$all = $this->discover_migrations();

		foreach ( $migrations as $record ) {
			if ( ! isset( $all[ $record->migration ] ) ) {
				continue;
			}

			$file = $all[ $record->migration ];
			require_once $file;

			$class_name = $this->filename_to_classname( $record->migration );
			$migration  = $this->resolve_migration_class( $class_name );

			if ( $migration instanceof AbstractMigration ) {
				$migration->down();
				$wpdb->delete( $this->migrations_table, [ 'id' => $record->id ], [ '%d' ] );
			}
		}
	}

	private function ensure_migrations_table(): void {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$this->migrations_table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			migration varchar(255) NOT NULL,
			batch int(11) NOT NULL,
			executed_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			UNIQUE KEY migration (migration)
		) {$charset_collate};";

		dbDelta( $sql );
	}

	private function get_executed_migrations(): array {
		global $wpdb;

		$table_exists = $wpdb->get_var(
			$wpdb->prepare(
				'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s AND table_name = %s',
				DB_NAME,
				$this->migrations_table
			)
		);

		if ( ! $table_exists ) {
			return [];
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$results = $wpdb->get_col( "SELECT migration FROM {$this->migrations_table} ORDER BY id ASC" );

		return $results ?: [];
	}

	private function discover_migrations(): array {
		if ( ! empty( $this->migration_paths ) ) {
			$paths = $this->migration_paths;
		} else {
			$registry = \FlowForms\Plugin::instance()->container()->get( ModuleRegistry::class );
			$paths    = $registry->get_all_migration_paths();
		}

		$files = [];

		foreach ( $paths as $dir ) {
			$glob = glob( $dir . '/*.php' );
			if ( $glob ) {
				foreach ( $glob as $file ) {
					$name           = pathinfo( $file, PATHINFO_FILENAME );
					$files[ $name ] = $file;
				}
			}
		}

		ksort( $files );

		return $files;
	}

	private function filename_to_classname( string $filename ): string {
		$parts      = explode( '_', $filename );
		$name_parts = array_slice( $parts, 4 );

		return implode( '', array_map( 'ucfirst', $name_parts ) );
	}

	private function resolve_migration_class( string $short_class_name ): ?AbstractMigration {
		foreach ( get_declared_classes() as $class ) {
			$reflection = new \ReflectionClass( $class );

			if (
				$reflection->getShortName() === $short_class_name
				&& $reflection->isSubclassOf( AbstractMigration::class )
			) {
				return new $class();
			}
		}

		return null;
	}
}
