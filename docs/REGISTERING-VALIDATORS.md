# Registering a custom FlowForms validator

Validators are attached per-field. In the form schema:

```json
{
    "id": "card_number",
    "type": "text",
    "label": "Card number",
    "validators": [
        { "id": "luhn",       "config": {} },
        { "id": "min_length", "config": { "min": 13 } }
    ]
}
```

The Validators panel in the field inspector auto-renders the per-validator settings from the schema returned by `get_settings_schema()`.

## Required methods

| Method                                | Purpose                                              |
|---------------------------------------|------------------------------------------------------|
| `get_id()`                            | Stable snake_case id                                 |
| `get_label()`                         | Label in the Validators panel                        |
| `validate( $value, $config, $field )` | Returns `true` for valid or an error message string  |

`get_settings_schema()` (optional) returns the per-instance config fields auto-rendered in the panel.

## Complete mu-plugin example: credit card Luhn check

```php
<?php
/**
 * Plugin Name: FlowForms Luhn Validator
 */

use FlowForms\Extensibility\Validators\AbstractValidator;

class LuhnValidator extends AbstractValidator {

    public function get_id(): string    { return 'luhn'; }
    public function get_label(): string { return __( 'Credit card (Luhn)', 'my-plugin' ); }

    public function get_description(): string {
        return __( 'Verifies a number is a valid credit-card check digit (Luhn algorithm).', 'my-plugin' );
    }

    public function get_settings_schema(): array {
        return []; // No per-field config needed.
    }

    public function validate( mixed $value, array $config, array $field ): true|string {
        $digits = preg_replace( '/\D/', '', (string) $value );
        if ( '' === $digits ) {
            return true; // Empty handled by 'required' validator.
        }

        $sum    = 0;
        $alt    = false;
        for ( $i = strlen( $digits ) - 1; $i >= 0; $i-- ) {
            $n = (int) $digits[ $i ];
            if ( $alt ) {
                $n *= 2;
                if ( $n > 9 ) $n -= 9;
            }
            $sum += $n;
            $alt = ! $alt;
        }

        if ( 0 !== $sum % 10 ) {
            return __( 'Please enter a valid card number.', 'my-plugin' );
        }
        return true;
    }
}

add_action( 'flowforms_register_validators', function ( $registry ) {
    $registry->register( new LuhnValidator() );
} );
```

## Built-in validators

`required`, `min_length`, `max_length`, `pattern_regex`, `email_dns`, `min_value`, `max_value`, `file_type`, `file_size`. Source at `src/Extensibility/Validators/Types/`.

## When is `validate()` called?

`EntryProcessor::validate_fields()` runs each validator in declaration order. The first failing validator's message is reported and the rest are skipped for that field. Validation runs **after** the active spam provider's `verify()` succeeds and **after** any type-level `AbstractFieldType::validate()` passes.
