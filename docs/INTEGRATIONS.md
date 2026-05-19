# Built-in integrations

FormsPress ships with five built-in actions that forward submissions to popular marketing/CRM platforms. Each integration is configured per-form from the Actions tab in the form builder — there is no global setting. You will need an API key (or private app token) from the provider; this page explains where to find it.

## Mailchimp — Add subscriber

In Mailchimp, click your avatar (top right) → **Profile** → **Extras** → **API keys** → **Create a key**. The key looks like `abc123def456-us21` — note the `-us21` suffix, FormsPress uses it to detect your data center. You will also need the **Audience ID**, available under **Audience → All contacts → Settings → Audience name and defaults**.

> _Screenshot: Mailchimp API keys page._

## ConvertKit — Subscribe

Log in to ConvertKit and open **Settings → Advanced → API**. Copy the **API Key** (not the API Secret). The **Form ID** is the numeric ID in the URL when you edit a ConvertKit form (`https://app.convertkit.com/forms/designers/{form_id}/edit`).

> _Screenshot: ConvertKit API settings._

## ActiveCampaign — Add contact

In ActiveCampaign, go to **Settings → Developer**. Copy the **URL** (e.g. `https://YOUR-ACCOUNT.api-us1.com`) and the **Key**. The list ID is shown in the URL when you open a list (`/app/contacts/?listid={list_id}`).

> _Screenshot: ActiveCampaign Developer settings._

## HubSpot — Create contact

HubSpot deprecated legacy API keys in 2022 — you must create a **Private App**. Go to **Settings (gear icon) → Integrations → Private Apps → Create a private app**, give it a name, then on the **Scopes** tab enable `crm.objects.contacts.write`. Save and copy the access token (starts with `pat-`).

> _Screenshot: HubSpot Private App scopes screen._

## Brevo — Add contact

Sign in to Brevo (formerly Sendinblue) and open **SMTP & API → API Keys → Generate a new API key**. Use the **v3** key. List IDs are visible on the **Contacts → Lists** page next to each list name.

> _Screenshot: Brevo API Keys page._

## Where do field IDs come from?

Each integration asks you for "Email field ID", "First name field ID", etc. The field ID is the **identifier** of the corresponding form field (set in the form builder when you add the field — for example `email`, `first_name`). It is _not_ a merge tag — type the bare ID, no curly braces.
