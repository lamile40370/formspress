<?php
/**
 * Plugin Name: FormsPress
 * Plugin URI:  https://example.com/formspress
 * Description: A powerful form builder for WordPress — standard Gutenberg forms and conversational flow forms, with entries logging and submission actions.
 * Version:     1.0.0
 * Author:      Emilien Laborde
 * Author URI:  https://example.com
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: formspress
 * Domain Path: /languages
 * Requires at least: 6.4
 * Requires PHP: 8.1
 */

defined( 'ABSPATH' ) || exit;

define( 'FLOWFORMS_VERSION', '1.0.0' );
define( 'FLOWFORMS_FILE', __FILE__ );
define( 'FLOWFORMS_DIR', plugin_dir_path( __FILE__ ) );
define( 'FLOWFORMS_URL', plugin_dir_url( __FILE__ ) );
define( 'FLOWFORMS_BASENAME', plugin_basename( __FILE__ ) );

if ( file_exists( FLOWFORMS_DIR . 'vendor/autoload.php' ) ) {
	require_once FLOWFORMS_DIR . 'vendor/autoload.php';
}

register_activation_hook( __FILE__, [ FlowForms\Activator::class, 'activate' ] );
register_deactivation_hook( __FILE__, [ FlowForms\Deactivator::class, 'deactivate' ] );

add_action( 'plugins_loaded', function () {
	FlowForms\Plugin::instance()->init();
} );
