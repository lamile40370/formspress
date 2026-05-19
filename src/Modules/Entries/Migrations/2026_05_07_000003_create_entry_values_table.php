<?php

use FlowForms\Core\AbstractMigration;

class CreateEntryValuesTable extends AbstractMigration {

	public function up(): void {
		$this->create_table( 'ff_entry_values', "
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			entry_id bigint(20) unsigned NOT NULL,
			field_id varchar(100) NOT NULL,
			field_label varchar(255) DEFAULT NULL,
			field_value longtext DEFAULT NULL,
			PRIMARY KEY (id),
			KEY entry_id (entry_id)
		" );
	}

	public function down(): void {
		$this->drop_table( 'ff_entry_values' );
	}
}
