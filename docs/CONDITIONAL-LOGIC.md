# Conditional Logic

FormsPress supports per-field conditional logic on both Standard and Flow forms.
A field can declare a `conditions` array that determines whether the field is
shown, hidden, or (Flow forms only) skipped, based on the values of fields that
appear before it.

## Data model

Each field can store an optional `conditions` object:

```json
{
  "id": "phone_question",
  "type": "phone",
  "label": "Phone number",
  "conditions": {
    "action": "show",
    "logic":  "all",
    "rules": [
      { "field": "country",    "op": "equals",    "value": "FR" },
      { "field": "wants_call", "op": "is_truthy", "value": "" }
    ]
  }
}
```

- `action` — `show` (default, show when rules match) · `hide` (hide when rules match) · `skip` (Flow forms only — skip the step when rules match).
- `logic` — `all` (AND across rules) · `any` (OR across rules).
- `rules[].field` — id of a **previous** field on the form (forward references are not allowed).
- `rules[].op` — one of: `equals`, `not_equals`, `contains`, `not_contains`, `is_empty`, `is_not_empty`, `is_truthy`, `is_falsy`, `greater_than`, `less_than`.
- `rules[].value` — the comparand. Ignored for value-less ops (`is_empty`, `is_not_empty`, `is_truthy`, `is_falsy`).

A missing or empty `conditions.rules` means "always visible".

## Runtime behaviour

- **Frontend (Standard forms)** — `assets/frontend/forms.js` re-evaluates every
  field with `data-conditions` on each `input`/`change` event and toggles the
  wrapper's `hidden` attribute + ARIA state.
- **Frontend (Flow forms)** — `showStep()` calls `computeVisibleStepIndex()`
  which skips any step whose conditions evaluate the step as hidden. Back
  navigation honours the same skip behaviour.
- **Server** — `\FlowForms\Modules\Entries\Services\Conditional\ConditionEvaluator`
  is invoked from `EntryProcessor::process()` *before* validation.
  Hidden fields are excluded from validation **and** stripped from the persisted
  entry (so we never store answers the user couldn't see).

## Examples

### Show "Company name" only for business customers

```json
{
  "id": "company_name",
  "type": "text",
  "label": "Company name",
  "conditions": {
    "action": "show",
    "logic":  "all",
    "rules": [
      { "field": "customer_type", "op": "equals", "value": "business" }
    ]
  }
}
```

### Hide an upsell field if budget is under €100

```json
{
  "id": "addons",
  "type": "checkbox",
  "label": "Optional add-ons",
  "options": [ "Express delivery", "Gift wrap" ],
  "conditions": {
    "action": "hide",
    "logic":  "all",
    "rules": [
      { "field": "budget", "op": "less_than", "value": "100" }
    ]
  }
}
```

### Skip the phone step on Flow forms when the user doesn't want a call

```json
{
  "id": "phone",
  "type": "phone",
  "label": "Phone number",
  "conditions": {
    "action": "skip",
    "logic":  "any",
    "rules": [
      { "field": "wants_call", "op": "is_falsy", "value": "" },
      { "field": "wants_call", "op": "equals",    "value": "no" }
    ]
  }
}
```
