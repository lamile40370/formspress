# Registering a custom FormsPress action

> See [EXTENDING.md](./EXTENDING.md) for the full extensibility map (field types, validators, anti-spam, storage).

Extend `FlowForms\Modules\Actions\Services\AbstractAction` and register on the `flowforms_register_actions` hook.

```php
<?php
use FlowForms\Modules\Actions\Services\AbstractAction;

class SlackAction extends AbstractAction {
    public function get_id(): string { return 'slack'; }
    public function get_label(): string { return 'Slack notification'; }
    public function get_icon(): string { return 'chartBar'; } // see ICON_MAP in ActionsPanel.js
    public function get_description(): string { return 'Send a message to a Slack channel.'; }

    public function get_fields(): array {
        return [
            [ 'key' => 'webhook_url', 'type' => 'url',  'label' => 'Slack webhook URL' ],
            [ 'key' => 'channel',     'type' => 'text', 'label' => 'Channel', 'placeholder' => '#general' ],
            [ 'key' => 'mention',     'type' => 'toggle', 'label' => 'Mention @here', 'default' => false ],
            [ 'key' => 'template',    'type' => 'textarea', 'label' => 'Message', 'help' => 'Supports {field:id} variables', 'rows' => 5 ],
        ];
    }

    public function run( array $action_config, array $entry, array $form ): void {
        $message = $this->resolve_variables( $action_config['template'] ?? '', $entry, $form );
        wp_remote_post( $action_config['webhook_url'], [
            'headers' => [ 'Content-Type' => 'application/json' ],
            'body'    => wp_json_encode( [ 'text' => $message, 'channel' => $action_config['channel'] ?? null ] ),
        ] );
    }
}

add_action( 'flowforms_register_actions', function ( $registry ) {
    $registry->register( new SlackAction() );
} );
```

The action appears in the form builder's Actions tab with the declared fields auto-rendered.

## Supported field types

| `type`     | Renders                  | Extra keys              |
|------------|--------------------------|-------------------------|
| `text`     | `TextControl`            | —                       |
| `textarea` | `TextareaControl`        | `rows` (int, default 4) |
| `select`   | `SelectControl`          | `options` (required: `[{value,label}, ...]`) |
| `toggle`   | `ToggleControl`          | —                       |
| `url`      | `TextControl type=url`   | —                       |
| `password` | `TextControl type=password` | —                    |
| `number`   | `TextControl type=number` | `min`, `max`           |

All descriptors support `help`, `placeholder`, and `default`.

## Built-in integrations

FormsPress ships with five built-in marketing/CRM action plugins. Each lives in `src/Modules/Actions/Services/Actions/Integrations/` and is registered alongside the core Email/Webhook/Redirect actions in `ActionRegistry`. They are configured per-form — there is no global API key option.

| `id`              | Label                              | Required fields                              |
|-------------------|------------------------------------|----------------------------------------------|
| `mailchimp`       | Mailchimp — Add subscriber         | `api_key`, `list_id`, `email_field`          |
| `convertkit`      | ConvertKit — Subscribe             | `api_key`, `form_id`, `email_field`          |
| `activecampaign`  | ActiveCampaign — Add contact       | `api_url`, `api_key`, `email_field`          |
| `hubspot`         | HubSpot — Create contact           | `access_token`, `email_field`                |
| `brevo`           | Brevo — Add contact                | `api_key`, `email_field`                     |

Each integration accepts optional first/last name field IDs and provider-specific extras (tags, list IDs, lifecycle stage, etc.). HTTP calls go through `wp_remote_post()` with a 10s timeout; failures are written to the PHP error log and never throw — submissions never 500 because of an integration outage.

See [INTEGRATIONS.md](INTEGRATIONS.md) for end-user instructions on where to find each provider's API credentials.

## The `get_field_value()` helper

Integrations don't use merge tags for the email/name/phone lookups — the user enters a literal field ID. `AbstractAction::get_field_value( string $field_id, array $entry ): string` returns the submitted value for that field ID, or an empty string if not found.

## Icons

Icons are looked up against an `ICON_MAP` in `assets/src/modules/forms/components/ActionsPanel.js`. Supported names today: `email`, `link`, `redo`, `brush`, `chartBar`, `cog`. To add a new icon, import it from `@wordpress/icons` and add it to the map.
