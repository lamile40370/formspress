<?php
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

global $wpdb;

$tables = [
	$wpdb->prefix . 'ff_entry_values',
	$wpdb->prefix . 'ff_entries',
	$wpdb->prefix . 'ff_forms',
	$wpdb->prefix . 'ff_migrations',
];

foreach ( $tables as $table ) {
	// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	$wpdb->query( "DROP TABLE IF EXISTS {$table}" );
}

delete_option( 'flowforms_version' );
delete_option( 'flowforms_settings' );
