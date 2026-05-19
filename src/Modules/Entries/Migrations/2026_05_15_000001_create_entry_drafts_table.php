<?php

use FlowForms\Core\AbstractMigration;

class CreateEntryDraftsTable extends AbstractMigration {

	public function up(): void {
		$this->create_table( 'ff_entry_drafts', "
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			form_id bigint(20) unsigned NOT NULL,
			token varchar(64) NOT NULL,
			email varchar(190) DEFAULT NULL,
			data longtext DEFAULT NULL,
			current_step int(11) NOT NULL DEFAULT 0,
			created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			expires_at datetime DEFAULT NULL,
			PRIMARY KEY (id),
			UNIQUE KEY token (token),
			KEY form_id (form_id),
			KEY expires_at (expires_at)
		" );
	}

	public function down(): void {
		$this->drop_table( 'ff_entry_drafts' );
	}
}
