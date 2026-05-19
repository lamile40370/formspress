<?php

use FlowForms\Core\AbstractMigration;

class CreateWebhookSubscriptionsTable extends AbstractMigration {

	public function up(): void {
		$this->create_table( 'ff_webhook_subscriptions', "
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			name varchar(190) NOT NULL,
			url text NOT NULL,
			events text NOT NULL,
			secret varchar(64) NOT NULL DEFAULT '',
			active tinyint(1) NOT NULL DEFAULT 1,
			created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY active (active)
		" );
	}

	public function down(): void {
		$this->drop_table( 'ff_webhook_subscriptions' );
	}
}
