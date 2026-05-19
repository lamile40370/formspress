<?php

use FlowForms\Core\AbstractMigration;

/**
 * Per-entry meta table — used by actions (Stripe etc.) to stash arbitrary
 * key/value data against an entry without bloating the columns of the main
 * ff_entries table.
 */
class CreateEntryMetaTable extends AbstractMigration {

	public function up(): void {
		$this->create_table( 'ff_entry_meta', "
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			entry_id bigint(20) unsigned NOT NULL,
			meta_key varchar(191) NOT NULL,
			meta_value longtext DEFAULT NULL,
			PRIMARY KEY (id),
			KEY entry_id (entry_id),
			KEY meta_key (meta_key)
		" );
	}

	public function down(): void {
		$this->drop_table( 'ff_entry_meta' );
	}
}
