# FormsPress Analytics

FormsPress ships with a built-in, privacy-first analytics module that captures
form performance — views, starts, step-by-step completion, submissions, and the
abandonment funnel.

## What gets tracked

| Event     | Fired by                                            | Notes |
|-----------|-----------------------------------------------------|-------|
| `view`    | Server-side (PHP) on render                         | One per page render |
| `start`   | Client-side on first focus / input in the form      | Once per session |
| `step`    | Client-side on Flow `showStep(n)` / Standard Next   | `step_index` payload |
| `submit`  | Client-side on successful submit                    | Once per session |
| `abandon` | Client-side on `beforeunload` (uses `sendBeacon`)   | Only if started + has values |

Each event row contains: `form_id`, `variant_id` (optional), `step_index`
(optional), `session_id` (random per browser tab), `referrer` (URL only),
`user_agent_hash` (md5 of UA — never the full string), `country_code` (ISO-2,
optional, off by default), and `created_at`.

## Privacy

- **No raw IP addresses** are ever stored.
- **No full user-agents** — only an MD5 hash of the UA string.
- **No PII** — analytics events never contain field values, emails, names,
  or any user-entered data.
- **Country resolution is opt-in.** The `flowforms_analytics_ip_to_country`
  filter must be implemented by a third-party plugin (e.g. MaxMind GeoIP):

  ```php
  add_filter( 'flowforms_analytics_ip_to_country', function ( $code, $ip ) {
      return my_geoip_lookup( $ip ); // returns 'US', 'FR', …
  }, 10, 2 );
  ```

  Without that filter, `country_code` is always `null`.
- **Session IDs** are random per-tab tokens stored in `sessionStorage`, not
  persistent cookies. They reset when the tab closes.

## Opting out

Analytics is **on by default**. To disable globally:

```php
update_option( 'flowforms_settings', [
    'disable_analytics' => true,
    // …other settings
] );
```

Or per-form, in the form `settings`:

```json
{ "disable_analytics": true }
```

## Retention & cleanup

A daily WP-Cron job `flowforms_analytics_cleanup` purges events older than
365 days. Override via:

```php
add_filter( 'flowforms_analytics_retention_days', fn() => 90 );
```

## API

| Endpoint                                         | Auth        | Description |
|--------------------------------------------------|-------------|-------------|
| `POST /flowforms/v1/analytics/track`             | Public      | Client event ingest (rate-limited 60/min/IP) |
| `GET  /flowforms/v1/forms/{id}/analytics?range=` | `manage_options` | Dashboard data |

`range` accepts `7`, `14`, `30`, `90` (days). Response shape:

```json
{
  "views": 1234, "starts": 890, "submits": 312,
  "completion_rate": 35.1, "view_to_submit_rate": 25.3,
  "by_day":        [ { "date", "views", "starts", "submits", "abandons" } ],
  "funnel":        [ { "step", "label", "visitors", "dropoff" } ],
  "top_referrers": [ { "referrer", "count" } ],
  "top_countries": [ { "country_code", "count" } ],
  "variants":      [ { "variant_id", "views", "submits", "rate" } ]
}
```
