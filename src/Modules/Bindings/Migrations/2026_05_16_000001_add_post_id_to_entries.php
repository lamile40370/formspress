<?php

use FlowForms\Core\AbstractMigration;

class AddPostIdToEntries extends AbstractMigration {

	public function up(): void {
		global $wpdb;
		$table = $this->table( 'ff_entries' );

		/* Guard: only add if missing. */
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$exists = $wpdb->get_var( $wpdb->prepare(
			'SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = %s AND table_name = %s AND column_name = %s',
			DB_NAME,
			$table,
			'post_id'
		) );

		if ( ! $exists ) {
			$this->add_column( 'ff_entries', 'post_id', 'bigint(20) unsigned DEFAULT NULL AFTER user_id' );
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "ALTER TABLE {$table} ADD KEY post_id (post_id)" );
		}
	}

	public function down(): void {
		$this->drop_column( 'ff_entries', 'post_id' );
	}
}
