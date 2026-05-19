<?php

use FlowForms\Core\AbstractMigration;

class CreateEmailTemplatesTable extends AbstractMigration {

	public function up(): void {
		$this->create_table( 'ff_email_templates', "
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			name varchar(190) NOT NULL,
			subject varchar(255) NOT NULL DEFAULT '',
			body longtext NOT NULL,
			created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY name (name)
		" );
	}

	public function down(): void {
		$this->drop_table( 'ff_email_templates' );
	}
}
