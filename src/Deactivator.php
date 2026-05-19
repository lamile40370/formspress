<?php

namespace FlowForms;

class Deactivator {

	public static function deactivate(): void {
		flush_rewrite_rules();
	}
}
