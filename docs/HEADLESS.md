# FormsPress as a headless API

FormsPress works fine inside a classic WordPress site, but everything it does
is also addressable as a REST API at `/wp-json/flowforms/v1/*`. This page is
the reference for using it from a separate frontend — Next.js, Astro, Nuxt,
SvelteKit, a mobile app, anything that can speak HTTP.

## Enabling headless mode

WP Admin -> FormsPress -> Settings -> **Headless API**:

- **Enable headless mode** — turns on the CORS layer and Bearer-token auth.
- **Allowed origins** — one origin per line (`https://app.example.com`).
  Use `*` to allow any origin (only for development).

Behind the scenes both settings live under `flowforms_settings`:

```php
update_option( 'flowforms_settings', array_merge(
    get_option( 'flowforms_settings', [] ),
    [
        'headless_mode' => true,
        'cors_origins'  => "https://app.example.com\nhttps://staging.example.com",
    ]
) );
```

You can also override the allow-list at runtime:

```php
add_filter( 'flowforms_cors_origins', function ( $origins ) {
    $origins[] = 'https://preview.example.com';
    return $origins;
} );
```

## Authentication

FormsPress accepts three modes:

| Mode                              | When to use                                 |
|-----------------------------------|---------------------------------------------|
| WP cookie + `X-WP-Nonce`          | Logged-in admin UI calls.                   |
| Application Password              | Server-to-server with admin credentials.    |
| Per-form public token             | Public submissions from a static frontend.  |

### Application Passwords (recommended for headless)

1. WP Admin -> Users -> *your user* -> **Application Passwords**.
2. Generate a password named e.g. `FormsPress headless`.
3. Use it with Basic auth:

   ```bash
   curl -u 'admin:xxxx xxxx xxxx xxxx xxxx xxxx' \
        https://example.com/wp-json/flowforms/v1/forms
   ```

This grants full FormsPress access (admin-level), so keep the password in a
server-side secret store and never ship it to the browser.

### Per-form public tokens

For the only endpoint that legitimately needs to be public — submitting an
entry — FormsPress can rotate a stable bearer token:

```bash
curl -X POST \
     -u 'admin:appPass' \
     https://example.com/wp-json/flowforms/v1/forms/17/token/rotate
```

Response:

```json
{ "success": true, "data": { "form_id": 17, "token": "ff_pub_aBcDeF…" } }
```

Submit with that token from the browser:

```js
await fetch('/wp-json/flowforms/v1/forms/17/submit', {
  method:  'POST',
  headers: {
    'Content-Type':  'application/json',
    'Authorization': 'Bearer ff_pub_aBcDeF…',
  },
  body:    JSON.stringify({ name: 'Jane', email: 'jane@example.com' }),
});
```

`ff_pub_*` tokens are scoped to a single form, can be rotated independently,
and are useless against any other endpoint. They're safe to embed in a
public client.

## Reference

All endpoints are prefixed with `/wp-json/flowforms/v1`. Read endpoints
return `{ success: true, data: ... }`; mutations return the updated
resource.

### Forms

```bash
# List
curl https://example.com/wp-json/flowforms/v1/forms

# Get
curl https://example.com/wp-json/flowforms/v1/forms/17

# Submit (public)
curl -X POST \
     -H 'Content-Type: application/json' \
     -H 'Authorization: Bearer ff_pub_xxx' \
     -d '{"name":"Jane","email":"jane@example.com","message":"Hi!"}' \
     https://example.com/wp-json/flowforms/v1/forms/17/submit
```

### Entries (admin)

```bash
# List entries for a form
curl -u 'admin:appPass' \
     https://example.com/wp-json/flowforms/v1/forms/17/entries

# Get one
curl -u 'admin:appPass' \
     https://example.com/wp-json/flowforms/v1/entries/8421

# Delete one
curl -u 'admin:appPass' -X DELETE \
     https://example.com/wp-json/flowforms/v1/entries/8421
```

### Templates

```bash
# Form templates
curl https://example.com/wp-json/flowforms/v1/templates

# Email templates
curl -u 'admin:appPass' \
     https://example.com/wp-json/flowforms/v1/email-templates
```

### Actions schema

```bash
curl https://example.com/wp-json/flowforms/v1/actions
```

Returns the descriptor for every registered action (Email, Webhook, Redirect,
Mailchimp…). Useful if you want to render your own form-builder UI.

### Webhooks (admin)

See `WEBHOOKS.md`.

## CORS

When headless mode is on, FormsPress sets these headers on every
`/flowforms/v1/*` response if the request `Origin` is in the allow-list:

```
Access-Control-Allow-Origin: <matched origin>
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce, X-FormsPress-Token
Vary: Origin
```

Preflight `OPTIONS` requests are handled by core WordPress + the headers
above — no extra config needed.

## Rate limiting

FormsPress does not rate-limit by itself. For production traffic, put a
proxy in front: Cloudflare Rules, AWS WAF, or `nginx limit_req_zone`. Target
the `/wp-json/flowforms/v1/forms/*/submit` path with a per-IP bucket
(suggested: 10 req / minute).

Inside WordPress, plugins like **WP Rate Limit** or **WP REST Cache** can
help, but a proxy-level limiter is more reliable.

## Next.js example: list, embed, submit

```tsx
// app/contact/page.tsx
async function getForm() {
  const res = await fetch(
    `${ process.env.WP_BASE }/wp-json/flowforms/v1/forms/17`,
    { next: { revalidate: 60 } }
  );
  return res.json();
}

export default async function ContactPage() {
  const { data: form } = await getForm();

  async function submit(formData: FormData) {
    'use server';
    await fetch(
      `${ process.env.WP_BASE }/wp-json/flowforms/v1/forms/17/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ process.env.FORMSPRESS_PUB_TOKEN }`,
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      }
    );
  }

  return (
    <form action={ submit }>
      <h1>{ form.title }</h1>
      { form.fields.map((f: any) => (
        <label key={ f.id }>
          { f.label }
          <input name={ f.id } required={ !! f.required } />
        </label>
      )) }
      <button type="submit">Send</button>
    </form>
  );
}
```

## Troubleshooting

- **CORS preflight fails** — check that your origin is in the allow-list and
  that headless mode is enabled.
- **`rest_forbidden` on a public endpoint** — the request is missing both
  a cookie/nonce and a valid `ff_pub_<token>` for the form.
- **`401` on Application Password** — the user that owns the password
  doesn't have `manage_options`.
- **CORS works in dev but not prod** — caching proxies (e.g. Varnish,
  Cloudflare) sometimes strip `Vary: Origin`; add it back at the edge.
