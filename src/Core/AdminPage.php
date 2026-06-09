<?php

namespace FlowForms\Core;

use FlowForms\Hooks\Attributes\Action;

class AdminPage {

	public function __construct(
		private readonly ModuleRegistry $registry,
	) {}

	#[Action( 'admin_menu' )]
	public function register_menu(): void {
		add_menu_page(
			__( 'FormsPress', 'formspress' ),
			__( 'FormsPress', 'formspress' ),
			'manage_options',
			'flowforms',
			[ $this, 'render_app' ],
			'none',
			25
		);

		$nav_items = $this->registry->get_all_nav_items();

		foreach ( $nav_items as $item ) {
			$menu_slug = '/' === $item['path']
				? 'flowforms'
				: 'admin.php?page=flowforms#' . ltrim( $item['path'], '/' );

			add_submenu_page(
				'flowforms',
				$item['label'],
				$item['label'],
				'manage_options',
				$menu_slug
			);
		}
	}

	#[Action( 'admin_enqueue_scripts' )]
	public function enqueue_submenu_highlight( string $hook_suffix ): void {
		if ( 'toplevel_page_flowforms' !== $hook_suffix ) {
			return;
		}

		$nav_items = $this->registry->get_all_nav_items();
		$route_map = [];

		foreach ( $nav_items as $item ) {
			if ( '/' !== $item['path'] ) {
				$route_map[ ltrim( $item['path'], '/' ) ] = $item['label'];
			}
		}

		$routes_json = wp_json_encode( $route_map );

		wp_add_inline_script(
			'flowforms-admin',
			<<<JS
(function() {
	var routes = {$routes_json};
	function highlightSubmenu() {
		var hash = window.location.hash.replace(/^#\\/?/, '') || '';
		var submenuLinks = document.querySelectorAll('#adminmenu .wp-submenu a');
		submenuLinks.forEach(function(link) {
			var li = link.closest('li');
			if (!li) return;
			var href = link.getAttribute('href') || '';
			if (href.indexOf('page=flowforms') === -1) return;
			var isActive = false;
			if (!hash && href.indexOf('#') === -1) {
				isActive = href.indexOf('page=flowforms') !== -1 && href.indexOf('page=flowforms#') === -1;
			} else if (hash) {
				isActive = href.indexOf('#' + hash) !== -1 || href.indexOf('#/' + hash) !== -1;
			}
			li.classList.toggle('current', isActive);
			link.classList.toggle('current', isActive);
		});
	}
	highlightSubmenu();
	window.addEventListener('hashchange', highlightSubmenu);
})();
JS,
			'after'
		);
	}

	private function menu_icon_data_uri(): string {
		$path = FLOWFORMS_DIR . 'assets/images/menu-icon.svg';

		if ( ! is_readable( $path ) ) {
			return '';
		}

		$svg = file_get_contents( $path );
		if ( false === $svg ) {
			return '';
		}

		return 'data:image/svg+xml;base64,' . base64_encode( $svg );
	}

	#[Action( 'admin_head' )]
	public function style_menu_icon(): void {
		$icon = $this->menu_icon_data_uri();
		if ( '' === $icon ) {
			return;
		}
		?>
		<style>
			#adminmenu #toplevel_page_flowforms .wp-menu-image {
				display: flex;
				align-items: center;
				justify-content: center;
			}

			#adminmenu #toplevel_page_flowforms .wp-menu-image::before {
				content: "";
				display: block;
				width: 24px;
				height: 24px;
				background-image: url('<?php echo esc_attr( $icon ); ?>');
				background-repeat: no-repeat;
				background-position: center;
				background-size: contain;
				padding: 0;
			}
		</style>
		<?php
	}

	#[Action( 'admin_head' )]
	public function hide_admin_notices(): void {
		$screen = get_current_screen();
		if ( $screen && 'toplevel_page_flowforms' === $screen->id ) {
			remove_all_actions( 'admin_notices' );
			remove_all_actions( 'all_admin_notices' );
		}
	}

	public function render_app(): void {
		echo '<div id="flowforms-app" class="flowforms-wrap"></div>';
	}
}
