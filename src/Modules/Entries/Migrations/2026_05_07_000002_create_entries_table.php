<?php

use FlowForms\Core\AbstractMigration;

class CreateEntriesTable extends AbstractMigration {

	public function up(): void {
		$this->create_table( 'ff_entries', "
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			form_id bigint(20) unsigned NOT NULL,
			status varchar(20) NOT NULL DEFAULT 'unread',
			ip_address varchar(45) DEFAULT NULL,
			user_agent text DEFAULT NULL,
			user_id bigint(20) unsigned DEFAULT NULL,
			source_url text DEFAULT NULL,
			created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY form_id (form_id),
			KEY status (status),
			KEY created_at (created_at)
		" );
	}

	public function down(): void {
		$this->drop_table( 'ff_entries' );
	}
}
