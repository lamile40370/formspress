<?php

namespace FlowForms\Contracts;

interface HookSubscriberInterface {

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public static function get_subscribed_hooks(): array;
}
