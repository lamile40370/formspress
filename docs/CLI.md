# FormsPress WP-CLI commands

FormsPress ships with a `wp formspress` command for scripted form / entry /
template management. Useful for staging-to-prod migrations, backups, GDPR
cleanup, and CI pipelines.

All commands require a working WP-CLI install. Run from the WordPress root.

## Forms

### `wp formspress form list`

List forms with `id`, `title`, `type`, `status`, `entries_count`, `created_at`.

```bash
wp formspress form list
wp formspress form list --format=json
wp formspress form list --format=csv > forms.csv
wp formspress form list --status=active
```

### `wp formspress form export <id> --output=<path>`

Export a single form's definition (fields / settings / actions) to JSON.

```bash
wp formspress form export 42 --output=/tmp/form-42.json
```

The file is self-describing (`_flowforms_export: form`) so import knows what
it's dealing with.

### `wp formspress form import <path> [--overwrite]`

Create a new form from a JSON export. With `--overwrite` and a matching `id`
in the file, updates the existing form instead.

```bash
wp formspress form import /tmp/form-42.json
wp formspress form import /tmp/form-42.json --overwrite
```

## Entries

### `wp formspress entry list <form_id>`

```bash
wp formspress entry list 42
wp formspress entry list 42 --format=csv --limit=200
wp formspress entry list 42 --since=2026-01-01
```

### `wp formspress entry export <form_id> --output=<path> [--format=csv|json] [--since=YYYY-MM-DD]`

Exports all entries (flattened — one row per submission, one column per
field). CSV is the default.

```bash
wp formspress entry export 42 --output=/tmp/entries.csv
wp formspress entry export 42 --output=/tmp/entries.json --format=json
wp formspress entry export 42 --output=/tmp/recent.csv --since=2026-05-01
```

### `wp formspress entry delete <entry_id> [--yes]`

Asks for confirmation unless `--yes` is passed.

```bash
wp formspress entry delete 1234 --yes
```

### `wp formspress entries purge <form_id> [--older-than=30 days]`

Bulk delete old entries for GDPR / disk cleanup. Default cutoff is 30 days.

```bash
wp formspress entries purge 42                       # > 30 days
wp formspress entries purge 42 --older-than="90 days"
wp formspress entries purge 42 --older-than="1 year" --yes
```

## Templates

### `wp formspress template list`

Lists both built-in form templates and saved email templates, with a `kind`
column to distinguish them.

```bash
wp formspress template list
```

### `wp formspress template export <id> --output=<path>`

Export a single template (form template by string ID, or an email template by
numeric ID) to a JSON file you can share or version-control.

```bash
wp formspress template export contact-form --output=/tmp/contact-form.json
wp formspress template export 7 --output=/tmp/welcome-email.json
```

## Exit codes & errors

All commands use `WP_CLI::error()` (non-zero exit) on validation failures and
`WP_CLI::success()` on completion, so they integrate cleanly with shell
pipelines and CI.

## Tips

- Combine with `wp option get / set` to script settings tweaks alongside
  form imports.
- Pair `entries purge` with `wp cron event run` if you want a scheduled
  cleanup outside of FormsPress' built-in retention setting.
- Use `--format=json` when piping output to `jq`.
