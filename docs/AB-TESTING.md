# FormsPress A/B Testing

Run multiple variants of the same form side-by-side to find the version that
converts best. Each variant has its own fields, settings, and weight.

## Concept

A form can have **2+ variants**. Each visitor is randomly assigned to one
variant on first view, weighted by the configured percentage. The assignment
sticks for 30 days via the `ff_variant_{form_id}` cookie (SameSite=Lax).

When variants are configured, every analytics event includes the assigned
`variant_id`, so you can compare views/submissions and completion rate per
variant in the form analytics dashboard.

## Enable A/B testing on a form

1. Open the form in the builder.
2. In the right "Form" inspector, expand **A/B testing**.
3. Toggle **Enable A/B testing** on.
4. Click **+ Add variant**. By default the original form is variant `A` and
   the new one is variant `B`, weighted 50 / 50.
5. Adjust weights — they must sum to 100.
6. Click any variant in the list to load it into the canvas for editing.

## Data shape

The form's `variants` column (longtext JSON) holds:

```json
[
  { "id": "A", "name": "Default",      "weight": 50, "fields": [...], "settings": {} },
  { "id": "B", "name": "Shorter form", "weight": 50, "fields": [...], "settings": {} }
]
```

When `variants` is `null` or `[]`, the form's legacy `fields`/`settings`
columns are used — full backwards compat.

## Reading results

In the form's Analytics page (Forms → "..." → View Analytics), an **A/B
variants** card appears whenever the form has 2+ variants. Each row shows:

- `variant_id` — A, B, C …
- `views` / `submits` — counts within the selected date range
- `rate` — `submits / views * 100`, the variant's conversion rate

Wait for ~95 % statistical confidence before declaring a winner. A rough rule
of thumb: at least 200 submissions per variant.

## V1 limitations

The variant editing UI is intentionally minimal in the first release:

- All variants share the **form title, description, status, and actions**.
  Only `fields` and `settings` are variant-scoped.
- Switching which variant is being edited is a top-level UI action — the
  canvas swaps instantly but is **not previewed side-by-side**.
- No automatic stat-sig calculator yet — compare rates manually.

## Cookie details

| Cookie              | Value     | Lifetime | Scope                |
|---------------------|-----------|----------|----------------------|
| `ff_variant_{id}`   | variant id (e.g. `A`) | 30 days | `path=/`, `SameSite=Lax` |

To force re-assignment for testing, clear the cookie in DevTools.
