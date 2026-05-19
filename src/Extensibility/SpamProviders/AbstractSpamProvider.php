<?php

namespace FlowForms\Extensibility\SpamProviders;

/**
 * Base class for FlowForms anti-spam providers (reCAPTCHA, hCaptcha, Turnstile, Akismet, …).
 *
 * Third-party plugins extend this class and register on the
 * `flowforms_register_spam_providers` hook to add custom providers.
 */
abstract class AbstractSpamProvider {

	/**
	 * Stable, unique id (snake_case). Stored in `flowforms_settings.spam.provider`.
	 */
	abstract public function get_id(): string;

	/**
	 * Human-readable label shown in the global Settings selector.
	 */
	abstract public function get_label(): string;

	/**
	 * Short description shown beneath the selector.
	 */
	public function get_description(): string {
		return '';
	}

	/**
	 * Field descriptors for the provider's global configuration (site key, secret, …).
	 *
	 * Same descriptor format as AbstractAction::get_fields().
	 *
	 * @return array<int, array<string, mixed>>
	 */
	abstract public function get_settings_schema(): array;

	/**
	 * Frontend assets (scripts and stylesheets) to enqueue when this provider is active.
	 *
	 * Return an array with optional `scripts` (URLs) and `styles` (URLs) keys.
	 *
	 * @return array{scripts?: array<int, string>, styles?: array<int, string>}
	 */
	public function get_frontend_assets( array $config ): array {
		return [];
	}

	/**
	 * Render the provider's HTML widget inserted at the form bottom.
	 *
	 * Typically returns a `<div>` with provider-specific data attributes or
	 * a hidden token input that the provider's JS will populate.
	 *
	 * @param array<string, mixed> $config Global provider config.
	 */
	abstract public function render_widget( array $config ): string;

	/**
	 * Verify a submitted token server-side.
	 *
	 * Return `true` for valid, or an error message string for invalid/spam.
	 *
	 * @param array<string, mixed> $config Global provider config.
	 */
	abstract public function verify( string $token, array $config, string $ip ): true|string;

	/**
	 * The form-field name (POST key) that holds the token from this provider.
	 */
	public function get_token_field_name(): string {
		return '_ff_spam_token';
	}
}
