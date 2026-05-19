<?php

use FlowForms\Core\AbstractMigration;

class CreateFormsTable extends AbstractMigration {

	public function up(): void {
		$this->create_table( 'ff_forms', "
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			title varchar(255) NOT NULL DEFAULT 'Untitled Form',
			description text DEFAULT NULL,
			type varchar(20) NOT NULL DEFAULT 'standard',
			fields longtext DEFAULT NULL,
			settings longtext DEFAULT NULL,
			actions longtext DEFAULT NULL,
			status varchar(20) NOT NULL DEFAULT 'active',
			created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY status (status),
			KEY type (type)
		" );
	}

	public function down(): void {
		$this->drop_table( 'ff_forms' );
	}
}
