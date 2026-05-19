<?php

use FlowForms\Core\AbstractMigration;

class AddVariantsToForms extends AbstractMigration {

	public function up(): void {
		global $wpdb;

		$table = $this->table( 'ff_forms' );

		/* Skip if column already exists. */
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$column = $wpdb->get_var( "SHOW COLUMNS FROM {$table} LIKE 'variants'" );
		if ( $column ) {
			return;
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "ALTER TABLE {$table} ADD COLUMN variants longtext NULL AFTER actions" );
	}

	public function down(): void {
		global $wpdb;

		$table = $this->table( 'ff_forms' );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$column = $wpdb->get_var( "SHOW COLUMNS FROM {$table} LIKE 'variants'" );
		if ( ! $column ) {
			return;
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "ALTER TABLE {$table} DROP COLUMN variants" );
	}
}
