# Email templates and the Email Designer

FormsPress includes a visual designer for notification and confirmation emails,
plus a reusable **email templates** library you can manage from the admin and
load into any form's Email action.

## Where to find it

- Per-form: open a form, add an **Email** action, the body now opens in the
  visual designer.
- Library: WP Admin -> FormsPress -> **Email Templates** -> *Add new*.

## The designer

- **Toolbar**: bold, italic, underline, link, lists, alignment.
- **Insert variable**: dropdown listing every merge tag available for this form
  (form-level, site-level, and `{field:id}` / `{label:id}` for each field).
- **Visual / HTML toggle**: switch to raw HTML if you need full control.
- **Live preview**: right pane re-renders on every keystroke using sample values
  drawn from the form's field labels.
- **Insert entry table**: drops the `[entry_table]` placeholder, replaced
  server-side with the auto-generated values table on send.
- **Reset to default**: replaces the body with a one-liner + entry table.
- **Save as template**: persists the current body as a reusable template in
  the library.

## Merge tags

| Tag                | Replaced with                          |
|--------------------|----------------------------------------|
| `{form_title}`     | the form's title                       |
| `{entry_id}`       | the entry's numeric ID                 |
| `{entry_date}`     | the entry creation timestamp           |
| `{site_name}`      | `get_bloginfo('name')`                 |
| `{site_url}`       | `get_site_url()`                       |
| `{field:<id>}`     | the value submitted for that field     |
| `{label:<id>}`     | the field's label                      |
| `[entry_table]`    | auto-generated HTML table of all values|

## Email shell

If the body doesn't start with `<!DOCTYPE` / `<html>` the action wraps the
content in a minimal responsive shell (centered 600 px white card,
viewport meta, inline styles for `h1`/`p`/`table`/`img`). This keeps emails
readable in Gmail, Outlook, Apple Mail, and most webmail clients without
forcing authors to write full HTML documents.

If you do want full control, paste a complete HTML document into the HTML mode
and FormsPress will leave it untouched.

## Design tips

- Keep paragraphs short — most readers skim on mobile.
- Use the merge tags rather than hard-coded names ("Hello {label:first_name},").
- Test with a real submission — the preview uses sample data only.
- Stick to web-safe fonts. The default shell uses the system stack.
- Avoid background images — they're stripped or blocked in many email clients.
- Inline images via the `<img>` tag work but be mindful of dark-mode rendering.

## REST API

| Method | Endpoint                              | Purpose          |
|--------|---------------------------------------|------------------|
| GET    | `/flowforms/v1/email-templates`       | List             |
| GET    | `/flowforms/v1/email-templates/{id}`  | Get              |
| POST   | `/flowforms/v1/email-templates`       | Create           |
| PUT    | `/flowforms/v1/email-templates/{id}`  | Update           |
| DELETE | `/flowforms/v1/email-templates/{id}`  | Delete           |

All endpoints require the `manage_options` capability.
