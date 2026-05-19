# Outgoing webhooks

FormsPress can push every form event to one or more external HTTPS endpoints —
think Zapier "Catch Hook", Make scenarios, n8n webhook triggers, custom Slack
relays, internal APIs, anything that speaks JSON over POST.

Webhooks are separate from the per-form **Webhook** action: that action
pushes a single submission to one URL. Outgoing webhooks here are **global**
subscriptions that fire on every matching event for every form.

## Manage subscriptions

WP Admin -> FormsPress -> **Webhooks**.

Each subscription has:

- **Name** — display only.
- **Target URL** — the HTTPS endpoint that will receive the POST.
- **Events** — which event names trigger delivery (multiselect).
- **Secret** — used to sign each delivery with HMAC-SHA256. Auto-generated if
  you leave it blank.
- **Active** — uncheck to pause without deleting.

Click **Test** on any row to fire a synthetic `entry.created` payload at the
URL. Useful while wiring up Zapier or Make for the first time.

## Events

| Event             | Fired when                                                   |
|-------------------|--------------------------------------------------------------|
| `entry.created`   | A submission is persisted (after server-side actions run).   |
| `entry.deleted`   | An entry is permanently deleted.                             |
| `entry.starred`   | An entry's status changes to `starred`.                      |
| `form.created`    | A new form is saved for the first time.                      |
| `form.updated`    | A form's definition is saved.                                |
| `form.deleted`    | A form is trashed.                                           |
| `form.published`  | A form's status transitions to `active`.                     |
| `form.unpublished`| A form's status transitions away from `active`.              |

## Payload shape

Every delivery has the same envelope:

```json
{
  "event":     "entry.created",
  "timestamp": "2026-05-16T09:32:14+00:00",
  "data":      { /* event-specific */ }
}
```

`entry.created` (the one Zapier users will pick up most often):

```json
{
  "event": "entry.created",
  "timestamp": "2026-05-16T09:32:14+00:00",
  "data": {
    "entry": {
      "id": 8421,
      "form_id": 17,
      "status": "unread",
      "created_at": "2026-05-16 09:32:13",
      "source_url": "https://example.com/contact/",
      "fields": {
        "name":    { "label": "Name",    "value": "Jane Doe" },
        "email":   { "label": "Email",   "value": "jane@example.com" },
        "message": { "label": "Message", "value": "Hi there!" }
      }
    },
    "form": {
      "id": 17,
      "title": "Contact",
      "type":  "standard",
      "status": "active"
    }
  }
}
```

## Headers

Each delivery includes:

| Header                       | Value                                           |
|------------------------------|-------------------------------------------------|
| `Content-Type`               | `application/json`                              |
| `User-Agent`                 | `FormsPress-Webhooks/<plugin-version>`          |
| `X-FormsPress-Event`         | the event name                                  |
| `X-FormsPress-Delivery`      | a unique UUID per delivery (idempotency key)    |
| `X-FormsPress-Signature`     | `sha256=<hex-hmac>` if a secret is configured   |

## Verifying the signature

The signature is `hmac_sha256(secret, raw_request_body)`, hex-encoded, with a
leading `sha256=`. To verify in Node:

```js
const crypto = require('crypto');
const signature = req.header('X-FormsPress-Signature') || '';
const expected  = 'sha256=' + crypto
  .createHmac('sha256', SECRET)
  .update(req.rawBody)             // raw bytes, NOT parsed JSON
  .digest('hex');
if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
  return res.status(401).end();
}
```

PHP:

```php
$expected = 'sha256=' . hash_hmac( 'sha256', file_get_contents( 'php://input' ), SECRET );
if ( ! hash_equals( $expected, $_SERVER['HTTP_X_FORMSPRESS_SIGNATURE'] ?? '' ) ) {
    http_response_code( 401 );
    exit;
}
```

## Delivery semantics

- **Timeout**: 8 seconds. Slow endpoints will be marked failed.
- **Retries**: none for now. If your endpoint returns non-2xx the failure is
  logged via `error_log()` and the event is dropped. A future release will add
  an Action Scheduler-backed retry queue.
- **Concurrency**: deliveries happen sequentially inside the request that
  triggered them. Keep your endpoints fast — long-running webhook
  consumers should accept fast and process async.
- **Order**: events for one form are dispatched in source order, but there is
  no global ordering guarantee across forms.

## Zapier walkthrough

1. In Zapier, create a new Zap. Trigger: **Webhooks by Zapier** -> **Catch Hook**.
2. Copy the "Custom Webhook URL" Zapier gives you.
3. In WP Admin -> FormsPress -> Webhooks -> **Add webhook**: paste the URL,
   pick the `entry.created` event, save.
4. Back in Zapier, click **Test trigger** — then in FormsPress click the
   **Test** button on the new row. Zapier will pick up the sample payload.
5. Use the parsed fields (`data.entry.fields.email.value`, etc.) to drive any
   downstream action.

Same flow works for Make and n8n — both have "instant webhook" trigger
modules that accept any JSON POST.

## REST API

| Method | Endpoint                                       | Purpose          |
|--------|------------------------------------------------|------------------|
| GET    | `/flowforms/v1/webhooks`                       | List             |
| POST   | `/flowforms/v1/webhooks`                       | Create           |
| PUT    | `/flowforms/v1/webhooks/{id}`                  | Update           |
| DELETE | `/flowforms/v1/webhooks/{id}`                  | Delete           |
| POST   | `/flowforms/v1/webhooks/{id}/test`             | Fire test event  |
| GET    | `/flowforms/v1/webhooks/events`                | List event names |

All require `manage_options`.
