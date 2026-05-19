<?php

use FlowForms\Core\AbstractMigration;

/**
 * Adds quiz-related columns to ff_entries:
 *   - `score` (DECIMAL(10,2)) — total score computed at submission time
 *   - `result_screen_id` (VARCHAR(64)) — id of the matched result screen
 *
 * Both are nullable so existing entries (which predate quiz support) are
 * untouched.
 */
class AddScoreToEntries extends AbstractMigration {

	public function up(): void {
		global $wpdb;
		$table = $this->table( 'ff_entries' );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$cols = $wpdb->get_col( "SHOW COLUMNS FROM {$table}" );
		$cols = is_array( $cols ) ? $cols : [];

		if ( ! in_array( 'score', $cols, true ) ) {
			$this->add_column( 'ff_entries', 'score', 'DECIMAL(10,2) NULL AFTER status' );
		}
		if ( ! in_array( 'result_screen_id', $cols, true ) ) {
			$this->add_column( 'ff_entries', 'result_screen_id', 'varchar(64) NULL AFTER score' );
		}
	}

	public function down(): void {
		$this->drop_column( 'ff_entries', 'score' );
		$this->drop_column( 'ff_entries', 'result_screen_id' );
	}
}
