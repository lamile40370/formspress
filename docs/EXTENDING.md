# Extending FlowForms

FlowForms ships with a small set of registry-based extension points that let third-party plugins ship their own:

| Capability        | Abstract base class                                            | Registration hook                          | Schema endpoint                     |
|-------------------|----------------------------------------------------------------|--------------------------------------------|-------------------------------------|
| Actions           | `FlowForms\Modules\Actions\Services\AbstractAction`            | `flowforms_register_actions`               | `GET /flowforms/v1/actions`         |
| Field types       | `FlowForms\Extensibility\FieldTypes\AbstractFieldType`         | `flowforms_register_field_types`           | `GET /flowforms/v1/field-types`     |
| Validators        | `FlowForms\Extensibility\Validators\AbstractValidator`         | `flowforms_register_validators`            | `GET /flowforms/v1/validators`      |
| Spam providers    | `FlowForms\Extensibility\SpamProviders\AbstractSpamProvider`   | `flowforms_register_spam_providers`        | `GET /flowforms/v1/spam-providers`  |
| File storage      | `FlowForms\Extensibility\Storage\AbstractStorageProvider`      | `flowforms_register_storage_providers`     | `GET /flowforms/v1/storage-providers` |

All registries follow the exact same pattern as the existing `ActionRegistry`:

1. Subclass the appropriate `Abstract*` class.
2. Implement the `get_id()`, `get_label()` and capability-specific methods.
3. Register your subclass on the `flowforms_register_*` hook.

Schemas are auto-shipped to the admin UI through `wp_localize_script( 'flowforms-admin', 'flowFormsData', … )` under the keys `fieldTypes`, `validators`, `spamProviders`, `storageProviders`. The form builder reads them dynamically — no JS bundle needs to ship with the host plugin in most cases.

## Skeleton: registering everything from one mu-plugin

```php
<?php
/**
 * Plugin Name: My FlowForms Extras
 */

use FlowForms\Modules\Actions\Services\AbstractAction;
use FlowForms\Extensibility\FieldTypes\AbstractFieldType;
use FlowForms\Extensibility\Validators\AbstractValidator;
use FlowForms\Extensibility\SpamProviders\AbstractSpamProvider;
use FlowForms\Extensibility\Storage\AbstractStorageProvider;

add_action( 'flowforms_register_actions',           fn( $r ) => $r->register( new MySlackAction() ) );
add_action( 'flowforms_register_field_types',       fn( $r ) => $r->register( new MyStarReviewFieldType() ) );
add_action( 'flowforms_register_validators',        fn( $r ) => $r->register( new MyLuhnValidator() ) );
add_action( 'flowforms_register_spam_providers',    fn( $r ) => $r->register( new MyAkismetSpamProvider() ) );
add_action( 'flowforms_register_storage_providers', fn( $r ) => $r->register( new MyS3StorageProvider() ) );
```

See the per-capability docs for full examples:

- [REGISTERING-ACTIONS.md](./REGISTERING-ACTIONS.md)
- [REGISTERING-FIELD-TYPES.md](./REGISTERING-FIELD-TYPES.md)
- [REGISTERING-VALIDATORS.md](./REGISTERING-VALIDATORS.md)
- [REGISTERING-SPAM-PROVIDERS.md](./REGISTERING-SPAM-PROVIDERS.md)
- [REGISTERING-STORAGE.md](./REGISTERING-STORAGE.md)

## Settings schema descriptor format

Every `get_settings_schema()` / `get_fields()` method returns the same shape:

```php
[
    [ 'key' => 'webhook_url', 'type' => 'url',  'label' => 'Webhook URL' ],
    [ 'key' => 'channel',     'type' => 'text', 'label' => 'Channel', 'placeholder' => '#general' ],
    [ 'key' => 'enabled',     'type' => 'toggle', 'label' => 'Enabled', 'default' => false ],
]
```

Supported `type` values: `text`, `textarea`, `select`, `toggle`, `url`, `password`, `number`. Optional keys: `help`, `placeholder`, `default`, `options` (select), `rows` (textarea), `min` / `max` (number).
