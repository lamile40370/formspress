# FormsPress Style Variations

FormsPress ships **form-level style variations** under `/styles/*.json`
— the same pattern FSE themes use for their own variations.

A user applying a variation in the form builder gets a one-click reskin
of every form-style attribute (radii, padding, button style, colours,
typography).

## Shipped variations

| id        | Vibe |
|-----------|------|
| `minimal` | Small radii, tight spacing, thin borders. |
| `bold`    | Heavy borders, large radii, oversize button. |
| `soft`    | Rounded everything, generous padding, light borders. |
| `ocean`   | Dark-blue background, white inputs, cyan accent. |
| `dark`    | Dark mode with cyan primary. |

Each lives in `styles/<id>.json`:

```json
{
  "title": "Minimal",
  "description": "Small radius, tight spacing, thin borders.",
  "form": {
    "border_radius": 2,
    "btn_radius": 2,
    "field_spacing": 16,
    "label_weight": "500"
  }
}
```

Every property under `form` maps 1:1 to `settings.style.*` on a form.

## Loading & precedence

`StyleVariationLoader` scans `styles/*.json` on demand, fires
`flowforms_register_style_variations` so third-party code can register
more, and the list is exposed:

- As REST: `GET /wp-json/flowforms/v1/style-variations`
- To the admin UI: `window.flowFormsData.styleVariations`

Applying a variation in the builder merges `variation.form` over the
form's current `settings.style` and stores `style_variation: variation.id`
on the form so the active card stays highlighted.

## Ship your own variation from a plugin

1. Drop a JSON file anywhere in your plugin.
2. Register it via the hook:

```php
add_action( 'flowforms_register_style_variations', function ( $loader ) {
    $loader->register( 'my-brand', [
        'title'       => 'My Brand',
        'description' => 'Match acme.com',
        'form'        => [
            'primary_color'  => '#ff5722',
            'btn_text_color' => '#ffffff',
            'btn_radius'     => 24,
            'border_radius'  => 12,
            'font_family'    => '"Inter", sans-serif',
        ],
    ] );
} );
```

That's it — the variation now appears in the FormsPress style
inspector for every form.

## Theme inheritance (live)

Variations don't override the **Color source** toggle (Custom palette vs
Inherit from theme). If a form has `style.source = 'theme'`, its colours
follow the active site Style Variation (`--wp--preset--color--primary`,
etc.) regardless of what colours the FormsPress variation embeds.
