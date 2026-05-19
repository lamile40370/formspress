<?php

namespace FlowForms\Core;

abstract class AbstractMigration {

	abstract public function up(): void;

	abstract public function down(): void;

	protected function table( string $name ): string {
		global $wpdb;
		return $wpdb->prefix . $name;
	}

	protected function charset_collate(): string {
		global $wpdb;
		return $wpdb->get_charset_collate();
	}

	protected function create_table( string $table_name, string $column_definitions ): void {
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$table   = $this->table( $table_name );
		$charset = $this->charset_collate();

		$sql = "CREATE TABLE {$table} (
			{$column_definitions}
		) {$charset};";

		dbDelta( $sql );
	}

	protected function drop_table( string $table_name ): void {
		global $wpdb;
		$table = $this->table( $table_name );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DROP TABLE IF EXISTS {$table}" );
	}

	protected function table_exists( string $table_name ): bool {
		global $wpdb;
		$table = $this->table( $table_name );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->get_var( "SHOW TABLES LIKE '{$table}'" ) === $table;
	}

	protected function add_column( string $table_name, string $column_name, string $definition ): void {
		global $wpdb;
		$table = $this->table( $table_name );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "ALTER TABLE {$table} ADD COLUMN {$column_name} {$definition}" );
	}

	protected function drop_column( string $table_name, string $column_name ): void {
		global $wpdb;
		$table = $this->table( $table_name );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "ALTER TABLE {$table} DROP COLUMN {$column_name}" );
	}
}
