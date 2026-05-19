# FlowForms — Stripe payments

FlowForms ships a built-in **Stripe Checkout** action. When the form is
submitted the action creates a Stripe Checkout Session, stores the session
id/url on the entry, and redirects the visitor to Stripe to take payment.
A webhook endpoint receives Stripe events to mark the entry as paid /
failed.

## Configuration

In your form's **Actions** panel add **Stripe — Take payment** and fill
in:

| Field                 | Notes                                                            |
| --------------------- | ---------------------------------------------------------------- |
| Stripe secret key     | `sk_test_…` or `sk_live_…` from your Stripe dashboard.           |
| Publishable key       | `pk_test_…` / `pk_live_…` (for future embedded Elements).        |
| Mode                  | `payment` or `subscription`                                      |
| Amount field          | ID of a form field (or a Calculation field) holding the amount.  |
| Currency              | `EUR`, `USD`, `GBP`, `CAD`, `AUD`, `JPY`                         |
| Description           | Free text, supports `{field:id}` merge tags.                     |
| Success URL           | Supports `{form_id}` and `{entry_id}`. We append `?stripe_session_id={CHECKOUT_SESSION_ID}&entry_id=…`. |
| Cancel URL            | Where Stripe sends the visitor on cancel.                        |
| Customer email field  | ID of the form field with the buyer email.                       |
| Metadata              | `key=field_id` per line — passed as Stripe session metadata.     |
| Webhook signing secret| `whsec_…` from Stripe → Developers → Webhooks → your endpoint.   |

## How the redirect happens

`StripePaymentAction::run()` runs after the entry has been persisted. It:

1. Resolves the amount via `get_field_value()` and converts it to
   minor-unit integers (× 100 — except for zero-decimal currencies like
   JPY which are sent as-is).
2. POSTs to `https://api.stripe.com/v1/checkout/sessions` with
   `wp_remote_post( …, [ 'timeout' => 15, 'blocking' => true ] )`.
3. Persists the session id + url + `stripe_status: pending` to the
   entry's meta table, and sets `redirect_url` on the entry.
4. `EntryProcessor` re-fetches the entry after actions run; if it sees
   a `redirect_url` it returns `{ action: 'redirect', redirect: … }`
   instead of `{ action: 'message' }`. The frontend's `forms.js` already
   redirects on this response shape.

## Webhook

Add a new Stripe webhook endpoint pointing at:

```
https://yoursite.example/wp-json/flowforms/v1/stripe/webhook
```

Subscribe to (at least):

- `checkout.session.completed`     → marks entry `paid`
- `checkout.session.expired`       → marks entry `failed`
- `payment_intent.payment_failed`  → marks entry `failed`

Stripe will reveal a per-endpoint signing secret (`whsec_…`) — copy it
into the action's **Webhook signing secret** field. FlowForms verifies the
`Stripe-Signature` header with `hash_hmac('sha256', $timestamp . '.' . $body, $secret)`
and rejects events older than 5 minutes. If no signing secret is
configured the webhook accepts the event but flags it as `unverified` in
the response (development mode).

## Example: donation with processing-fee calculation

Form fields:

1. `amount` — Number, label "How much would you like to donate?"
2. `fee` — Calculation, formula `round({field:amount} * 0.029 + 0.30, 2)`,
   format `currency`, decimals `2`.
3. `total` — Calculation, formula `{field:amount} + {field:fee}`,
   format `currency`.
4. `email` — Email.

Stripe action:

- Amount field: `total`
- Customer email field: `email`
- Description: `Donation from {field:email}`
- Metadata: `donor_email=email`

Because the **total** is server-recomputed by the calculation engine, the
visitor cannot tamper with the amount that hits Stripe.

## Security

- The Stripe secret key never leaves the server — only `wp_remote_post`
  sees it.
- All resolved fields run through `sanitize_text_field()` /
  `sanitize_email()` before being sent.
- The webhook endpoint is public (it must be — Stripe calls it) but
  signature verification gates state changes.
- Amounts always come from server-recomputed calculation fields when the
  amount itself is derived. Never trust the raw `amount` input alone if
  it's the basis for the charge.

## Implementation pointers

- Action     — `src/Modules/Actions/Services/Actions/StripePaymentAction.php`
- Module     — `src/Modules/Stripe/StripeModule.php`
- Webhook    — `src/Modules/Stripe/Endpoints/StripeWebhook.php`
- Meta table — migration `2026_05_16_000002_create_entry_meta_table.php`
