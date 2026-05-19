<?php

use FlowForms\Core\AbstractMigration;

class CreateAnalyticsTable extends AbstractMigration {

	public function up(): void {
		$this->create_table( 'ff_analytics', "
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			form_id bigint(20) unsigned NOT NULL,
			variant_id varchar(32) DEFAULT NULL,
			event varchar(32) NOT NULL,
			step_index int(11) DEFAULT NULL,
			session_id varchar(64) NOT NULL,
			referrer varchar(255) DEFAULT NULL,
			user_agent_hash varchar(32) DEFAULT NULL,
			country_code varchar(2) DEFAULT NULL,
			created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY idx_form_event (form_id, event, created_at),
			KEY idx_session (session_id)
		" );
	}

	public function down(): void {
		$this->drop_table( 'ff_analytics' );
	}
}
