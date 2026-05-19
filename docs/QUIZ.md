# FlowForms — Quiz / scoring

FlowForms supports turning any form into a graded quiz. Each option of a
`radio`, `select`, or `checkbox` field can carry a numeric **score**. On
submission the engine sums every selected option's score, then matches the
total against a list of **result screens** declared on the form.

The score is persisted on the entry (`score` column on `ff_entries`) and
returned to the frontend together with the matching result screen, so the
visitor can be shown a custom outcome.

## Data model

### Field options

`field.options` accepts two shapes — they can be mixed inside a single
field. Existing forms with plain string options keep working (score = 0):

```json
{
  "type": "radio",
  "id": "capital_of_france",
  "label": "What is the capital of France?",
  "options": [
    { "value": "Paris",  "score": 5 },
    { "value": "Lyon",   "score": 0 },
    { "value": "Marseille", "score": 0 }
  ]
}
```

### Form-level quiz settings

`form.settings.quiz`:

```json
{
  "enabled": true,
  "show_score_to_user": true,
  "failing_score": 3,
  "time_limit_seconds": 120,
  "result_screens": [
    {
      "id": "fail",
      "min_score": 0,
      "max_score": 4,
      "title": "Try again",
      "message": "You scored {score}/{max_score} — keep practicing!"
    },
    {
      "id": "pass",
      "min_score": 5,
      "max_score": 9,
      "title": "Nice work",
      "message": "You scored {score}/{max_score}."
    },
    {
      "id": "perfect",
      "min_score": 10,
      "max_score": 10,
      "title": "Perfect score!",
      "message": "Congratulations 🎉"
    }
  ]
}
```

### Result screen shape

```ts
type ResultScreen = {
  id:         string;    // stable identifier, persisted with the entry
  min_score:  number;    // inclusive
  max_score:  number;    // inclusive
  title:      string;
  message:    string;    // plain text — merge tags supported below
};
```

Screens are evaluated **in declaration order**; the first whose
`[min_score, max_score]` window contains the total wins.

## Scoring rules

- **Radio / select** — adds the score of the selected option (0 if none).
- **Checkbox** — adds the score of every selected option (sum).
- **`max_score`** — for radio/select it's the highest option score; for
  checkbox it's the sum of all positive scores (the theoretical max).

## API response

When `quiz.enabled` is true the `/forms/{id}/submit` response includes:

```json
{
  "success": true,
  "entry_id": 123,
  "score": 7,
  "max_score": 10,
  "result_screen": {
    "id": "pass",
    "title": "Nice work",
    "message": "You scored {score}/{max_score}."
  }
}
```

The frontend replaces the standard success message with a card showing
the result screen's title + message + (optional) score badge.

## Builder UI

A new **Quiz** panel appears in the form-level inspector. Toggle
`Enable quiz mode` and you get:

- Pass / fail score
- Time limit (seconds) — surfaced as a countdown on flow forms
- Show score to user toggle
- Repeating editor for result screens: ID, min, max, title, message

While quiz mode is on, every choice field shows a per-option score input
next to the value input.

## Migration

`2026_05_16_000001_add_score_to_entries.php` adds:

```sql
ALTER TABLE ff_entries
  ADD COLUMN score DECIMAL(10,2) NULL AFTER status,
  ADD COLUMN result_screen_id varchar(64) NULL AFTER score;
```

Both columns are nullable; the migration is a no-op for columns that
already exist (safe to re-run).

## Implementation pointers

- Scoring service — `src/Modules/Entries/Services/Quiz/QuizScorer.php`
- Wired into `EntryProcessor::score_quiz()` after validation, before persist
- Migration — `src/Modules/Entries/Migrations/2026_05_16_000001_add_score_to_entries.php`
