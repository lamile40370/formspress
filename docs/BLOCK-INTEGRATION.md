# FormsPress — Block integration guide

FormsPress ships two native Gutenberg blocks plus a set of opinionated
block patterns. This document is aimed at theme and plugin developers who
want to embed a FormsPress form in a template, template part, or pattern
without going through the block inserter.

## The blocks

| Block name              | Purpose                                      | Render            |
| ----------------------- | -------------------------------------------- | ----------------- |
| `formspress/form`       | Standard form (HTML field UI, REST submit)   | `blocks/form/render.php`       |
| `formspress/flow-form`  | Conversational, one-question-at-a-time form  | `blocks/flow-form/render.php`  |

Both are registered from `block.json` (apiVersion 3), so they participate
in every modern block feature: align, color/background/text, spacing
(padding + margin), typography (size, family, line-height) and border
(color, radius, width, style). Anything you set in the block inspector
becomes an inline style on the wrapper and OVERRIDES the form's own
theme palette for that placement only.

### Attributes

| Attribute            | Type     | Default | Description                              |
| -------------------- | -------- | ------- | ---------------------------------------- |
| `formId`             | number   | `0`     | ID of the form to render. `0` = empty.   |
| `displayTitle`       | boolean  | `false` | Render the form title as `<h2>`.         |
| `displayDescription` | boolean  | `false` | Render the form description. Standard form only. |

## Embedding the block

### In a post, page or template (block markup)

```html
<!-- wp:formspress/form {"formId":42,"displayTitle":true} /-->
```

```html
<!-- wp:formspress/flow-form {"formId":7} /-->
```

The block is self-closing (`/-->`) because rendering is fully server-side.

### In a `template-part` or full-site theme template

Drop the same comment markup into `parts/contact.html`,
`templates/page-contact.html`, etc. Block supports flow through normally,
so wrapping with a `<!-- wp:group -->` lets you constrain width or apply
backgrounds:

```html
<!-- wp:group {"layout":{"type":"constrained","contentSize":"640px"}} -->
<div class="wp-block-group">
    <!-- wp:heading --><h2 class="wp-block-heading">Contact</h2><!-- /wp:heading -->
    <!-- wp:formspress/form {"formId":42} /-->
</div>
<!-- /wp:group -->
```

### In a custom block pattern

```php
register_block_pattern( 'my-theme/contact', [
    'title'    => 'Contact',
    'content'  => '<!-- wp:formspress/form {"formId":0} /-->',
    'categories' => [ 'formspress' ],
] );
```

Leaving `formId` as `0` makes the pattern a starting point — the user
picks an actual form once they insert the pattern.

### Via the legacy shortcode

```
[formspress id="42"]
```

The shortcode is preserved for backwards compatibility and routes through
the same renderer (and same Interactivity API runtime for standard forms).
New embeds should prefer the block markup so they participate in block
supports (color, spacing, typography…).

## Style overrides via block supports

Because the block enables `color`, `spacing`, `typography` and
`__experimentalBorder`, anything the user picks in the block inspector is
written as an inline style on the block wrapper. Those declarations win
over the form's stored theme palette through normal cascade, giving
per-placement overrides without re-saving the form.

Example: dropping the same form on two different pages, with two
different background colors per page — done from the block inspector,
no form duplication.

## Frontend runtime

- Standard forms use the **WordPress Interactivity API** (`@wordpress/interactivity`).
  Submit, validation messages, and disabled-button state are all driven by
  declarative `data-wp-*` directives — no per-form imperative wiring.
- Flow forms keep the existing imperative `assets/frontend/forms.js`
  runtime; this preserves the iframe preview used by the form builder.
- REST contract is unchanged: `POST /wp-json/flowforms/v1/forms/{id}/submit`.

## Patterns shipped

All under the `formspress` pattern category:

- `formspress/contact-form-section`
- `formspress/newsletter-cta`
- `formspress/event-rsvp`
- `formspress/support-request`
- `formspress/lead-capture-hero`
