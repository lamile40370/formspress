# Registering a custom FlowForms field type

Extend `FlowForms\Extensibility\FieldTypes\AbstractFieldType` and register on the `flowforms_register_field_types` hook. The field appears in the form builder's field picker grouped under the `get_group()` you return.

## Required methods

| Method                     | Purpose                                                                 |
|----------------------------|-------------------------------------------------------------------------|
| `get_id()`                 | Stable snake_case id stored in form JSON as `field.type`                |
| `get_label()`              | Label shown in the field picker                                         |
| `get_group()`              | One of `basic`, `choice`, `advanced`, `layout`, `custom`                |
| `get_icon()`               | Dashicon slug (e.g. `star-filled`)                                      |
| `render_frontend( $field )`| HTML string for the input control on the front-end                      |

## Optional methods

| Method                          | Default                | Purpose                                      |
|---------------------------------|------------------------|----------------------------------------------|
| `get_default_value()`           | `''`                   | Value used when a new field is inserted      |
| `get_settings_schema()`         | `[]`                   | Inspector settings (placeholder, max, …)     |
| `validate( $value, $field )`    | `true`                 | Type-level validation                        |
| `sanitize( $value, $field )`    | `sanitize_text_field`  | Pre-storage sanitization                     |
| `is_storable()`                 | `true`                 | Set to `false` for layout-only fields        |
| `get_description()`             | `''`                   | One-line tooltip in the picker               |

## Complete mu-plugin example: "Star rating with reviews" field

```php
<?php
/**
 * Plugin Name: FlowForms Star Review Field
 */

use FlowForms\Extensibility\FieldTypes\AbstractFieldType;

class StarReviewFieldType extends AbstractFieldType {

    public function get_id(): string    { return 'star_review'; }
    public function get_label(): string { return __( 'Star rating + review', 'my-plugin' ); }
    public function get_group(): string { return 'custom'; }
    public function get_icon(): string  { return 'star-filled'; }

    public function get_description(): string {
        return __( 'A 1-5 star rating with an optional written review.', 'my-plugin' );
    }

    public function get_settings_schema(): array {
        return [
            [ 'key' => 'placeholder', 'type' => 'text',   'label' => __( 'Review placeholder', 'my-plugin' ) ],
            [ 'key' => 'max_length',  'type' => 'number', 'label' => __( 'Max review length', 'my-plugin' ), 'default' => 500 ],
        ];
    }

    public function render_frontend( array $field ): string {
        $id  = esc_attr( $field['id'] ?? '' );
        $ph  = esc_attr( $field['placeholder'] ?? __( 'Write a short review…', 'my-plugin' ) );

        $stars = '';
        for ( $i = 1; $i <= 5; $i++ ) {
            $stars .= '<span class="my-star" data-value="' . $i . '">★</span>';
        }

        return '
            <div class="my-star-review" data-field-id="' . $id . '">
                <div class="my-star-review__stars">' . $stars . '</div>
                <input type="hidden" name="' . $id . '[rating]" />
                <textarea name="' . $id . '[review]" placeholder="' . $ph . '" rows="3"></textarea>
            </div>
        ';
    }

    public function validate( mixed $value, array $field ): true|string {
        if ( ! is_array( $value ) || empty( $value['rating'] ) ) {
            if ( ! empty( $field['required'] ) ) {
                return __( 'Please choose a rating.', 'my-plugin' );
            }
        }
        return true;
    }

    public function sanitize( mixed $value, array $field ): mixed {
        if ( ! is_array( $value ) ) {
            return '';
        }
        $rating = absint( $value['rating'] ?? 0 );
        $review = sanitize_textarea_field( $value['review'] ?? '' );
        return $rating . ' ★ — ' . $review;
    }
}

add_action( 'flowforms_register_field_types', function ( $registry ) {
    $registry->register( new StarReviewFieldType() );
} );
```

The field is immediately picker-available and is rendered by `FormRenderer` on the front-end. No JS bundle changes required — the field-types schema is shipped to the admin via `window.flowFormsData.fieldTypes`.

## Built-in field types you can reference

`text`, `email`, `phone`, `number`, `url`, `textarea`, `select`, `radio`, `checkbox`, `yes_no`, `date`, `time`, `file`, `rating`, `opinion_scale`, `nps`, `hidden`, `signature`, `address`, `row`, `statement`, `section`, `page_break`. Their source is at `src/Extensibility/FieldTypes/Types/`.
