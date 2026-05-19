# Registering a custom FlowForms anti-spam provider

Extend `FlowForms\Extensibility\SpamProviders\AbstractSpamProvider` and register on the `flowforms_register_spam_providers` hook. Your provider then appears in **Settings → Anti-spam → Active provider**.

## Required methods

| Method                                       | Purpose                                                       |
|----------------------------------------------|---------------------------------------------------------------|
| `get_id()`                                   | Stable snake_case id stored in `flowforms_settings.spam.provider` |
| `get_label()`                                | Label in the provider selector                                |
| `get_settings_schema()`                      | Site key / secret key / threshold fields (auto-rendered)      |
| `render_widget( $config )`                   | HTML inserted at the form bottom (typically a hidden input)   |
| `verify( $token, $config, $ip )`             | Server-side verification — return `true` or error string      |

## Optional methods

| Method                                | Default              | Purpose                                                    |
|---------------------------------------|----------------------|------------------------------------------------------------|
| `get_description()`                   | `''`                 | Description shown beneath the selector                     |
| `get_frontend_assets( $config )`      | `[]`                 | `[ 'scripts' => [...], 'styles' => [...] ]` to enqueue     |
| `get_token_field_name()`              | `_ff_spam_token`     | POST key holding the token submitted to `/submit`          |

## Complete mu-plugin example: Akismet provider

Akismet is a content-based filter (not a CAPTCHA), so `render_widget()` returns an empty string and `verify()` consults the Akismet REST API.

```php
<?php
/**
 * Plugin Name: FlowForms Akismet Spam Provider
 */

use FlowForms\Extensibility\SpamProviders\AbstractSpamProvider;

class AkismetSpamProvider extends AbstractSpamProvider {

    public function get_id(): string    { return 'akismet'; }
    public function get_label(): string { return __( 'Akismet', 'my-plugin' ); }

    public function get_description(): string {
        return __( 'Server-side content-based spam check via Akismet. No CAPTCHA shown to the user.', 'my-plugin' );
    }

    public function get_settings_schema(): array {
        return [
            [ 'key' => 'api_key', 'type' => 'password', 'label' => __( 'Akismet API key', 'my-plugin' ) ],
        ];
    }

    public function render_widget( array $config ): string {
        return ''; // No visible widget — content-based check only.
    }

    public function verify( string $token, array $config, string $ip ): true|string {
        $api_key = (string) ( $config['api_key'] ?? '' );
        if ( '' === $api_key ) {
            return true; // Fail open if not configured.
        }

        $body = [
            'blog'                 => home_url(),
            'user_ip'              => $ip,
            'user_agent'           => sanitize_text_field( $_SERVER['HTTP_USER_AGENT'] ?? '' ),
            'referrer'             => sanitize_text_field( $_SERVER['HTTP_REFERER'] ?? '' ),
            'comment_type'         => 'contact-form',
        ];

        $response = wp_remote_post(
            "https://{$api_key}.rest.akismet.com/1.1/comment-check",
            [ 'body' => $body, 'timeout' => 10 ]
        );

        if ( is_wp_error( $response ) ) {
            return true; // Network blip — fail open.
        }

        if ( 'true' === trim( wp_remote_retrieve_body( $response ) ) ) {
            return __( 'Submission flagged as spam.', 'my-plugin' );
        }
        return true;
    }
}

add_action( 'flowforms_register_spam_providers', function ( $registry ) {
    $registry->register( new AkismetSpamProvider() );
} );
```

After registering, an admin can select **Akismet** in the Anti-spam settings tab and fill in their API key. The provider's `verify()` runs **before any action** on every submission.

## Built-in providers

`recaptcha_v3`, `turnstile`, `hcaptcha`. Source at `src/Extensibility/SpamProviders/Types/`.

The honeypot mechanism (`_ff_hp` hidden field) is always active independent of the selected provider, and is not modeled as a provider — leave it on for every form.
