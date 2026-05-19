<?php

namespace FlowForms\Hooks\Attributes;

use Attribute;

#[Attribute( Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE )]
class Action {

	public function __construct(
		public readonly string $hook,
		public readonly int $priority = 10,
		public readonly int $accepted_args = 1,
	) {}
}
