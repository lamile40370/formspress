# Block Bindings — FormsPress as a data sink

WordPress 6.5+ ships the Block Bindings API. Most plugins use it
"forwards" — a Gutenberg block reads from a source.

FormsPress uses it **backwards**: a form **field** becomes a data SINK.
When a visitor submits the form, the submitted value is automatically
written to a CPT, post meta, user meta, or site option — and the form's
entry row is linked to the resulting post.

## Configuring a binding

In the form builder, select a field, then expand the
**"Data binding (advanced)"** panel in the right inspector.

Each field's binding config lives at `field.binding` and looks like:

```json
{
  "target": "cpt | post_meta | user_meta | option",
  "source": {
    "post_type":  "lead",
    "meta_key":   "company",
    "option_key": "last_signup"
  }
}
```

### Targets

| target      | What it does |
|-------------|--------------|
| `cpt`       | Creates a new post on submit. Only one field per form can be the "primary" — every other field with `target=post_meta` is attached to that post. |
| `post_meta` | Stores the value as `update_post_meta` on the post created by the primary `cpt` field. |
| `user_meta` | Resolves an existing user by email (use `meta_key=_email` to mark the anchor field, or fallback: the first `email`-typed field). Skipped for unknown users. **No auto-register.** |
| `option`    | `update_option(source.option_key, $value)`. |

## Worked example — Lead capture form

A 4-field form: Name, Email, Company, Message. The form auto-creates a
`lead` CPT per submission.

| Field   | binding.target | binding.source                         |
|---------|----------------|----------------------------------------|
| Name    | `cpt`          | `{ post_type: "lead", meta_key: "lead_name" }` |
| Email   | `post_meta`    | `{ meta_key: "lead_email" }`           |
| Company | `post_meta`    | `{ meta_key: "company" }`              |
| Message | `post_meta`    | `{ meta_key: "message" }`              |

Submit → FormsPress saves the entry, then:

```php
$post_id = wp_insert_post( [
    'post_type'   => 'lead',
    'post_title'  => 'Lead capture #42',
    'post_status' => 'publish',
] );
update_post_meta( $post_id, 'lead_name',  'Ada Lovelace' );
update_post_meta( $post_id, 'lead_email', 'ada@example.com' );
update_post_meta( $post_id, 'company',    'Babbage Ltd' );
update_post_meta( $post_id, 'message',    '…' );
```

The entry row gets `post_id = $post_id` so admin UI can link to the post.

## Registering the CPT

By default, FormsPress will NOT register CPTs automatically — themes own
their post types. If the CPT isn't registered, the binding is skipped
and a notice is logged ("Register the CPT `lead` in your theme/functions.php
before using this binding.").

**Theme/plugin opt-in** to auto-register every CPT referenced by bindings:

```php
add_filter( 'flowforms_auto_register_cpts', '__return_true' );
```

FormsPress will then call `register_post_type()` with a sane default for
each missing CPT on `init`. Recommended for prototypes only.

## Reverse Block Bindings — read FormsPress options from any block

FormsPress also registers a Block Bindings **source** called
`formspress/option`. Any core block whose attribute supports bindings
can pull a value FormsPress has written:

```html
<!-- wp:paragraph {
  "metadata": {
    "bindings": {
      "content": {
        "source": "formspress/option",
        "args":   { "key": "last_signup_email" }
      }
    }
  }
} -->
<p></p>
<!-- /wp:paragraph -->
```

That paragraph now shows whatever the option `last_signup_email`
currently holds — populated by your form's `target=option` binding.

## Custom targets — ship your own binding (Akismet example)

Third-party plugins can register a custom binding target. The handler
runs on each entry, for each field tagged with that target.

```php
add_action( 'flowforms_register_binding_targets', function ( $registry ) {
    $registry->register( 'akismet', function ( $value, $source, $field, $entry, $ctx ) {
        Akismet::check_db_comment( [
            'comment_author'       => $value,
            'comment_author_email' => $ctx['form']['settings']['notification_email'] ?? '',
            'comment_content'      => $value,
        ] );
    } );
} );
```

Field configured as `target=akismet` will then route through that handler
on every submission. No re-deploy of FormsPress needed.
