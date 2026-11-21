# smartnshine.in deployment settings

The application now uses `https://www.smartnshine.in` for public links and
`https://api.smartnshine.in` for its production API. Support links and email
replies go to `contact@smartnshine.in`. The old domain remains allowed in backend
CORS during the transition. OAuth requests from the old frontend domain now
return to the corresponding `.in` domain, including the interview subdomain.

## Vercel

Add `smartnshine.in` and `www.smartnshine.in` to the main production deployment.
Redirect the bare domain to `www.smartnshine.in` in the project's Domains settings.
If using the interview subdomain, add `interview.smartnshine.in` to the same
`ai-interview` branch deployment currently used by `interview.smartnshine.app`.

Set these production environment variables (dashboard values override the
checked-in `.env.production` defaults), then redeploy:

```dotenv
VITE_API_URL=https://api.smartnshine.in/api
VITE_SERVER_URL=https://api.smartnshine.in
```

## Azure App Service

Bind `api.smartnshine.in` to the existing App Service, validate its DNS records,
and enable HTTPS before deploying the frontend that uses this hostname.
Update these application settings and restart/redeploy the backend:

Backend startup preserves Azure application settings over local `.env` files
and loads them before initializing the OAuth strategies.

```dotenv
CLIENT_URL=https://www.smartnshine.in
CLIENT_ORIGIN=https://www.smartnshine.in
SERVER_URL=https://api.smartnshine.in
ALLOWED_ORIGINS=https://smartnshine.in,https://www.smartnshine.in,https://interview.smartnshine.in
```

Keep any additional origins required by your deployment in `ALLOWED_ORIGINS`.
If sending mail from the new mailbox, configure `EMAIL_USER=contact@smartnshine.in`
and that mailbox's SMTP credentials, `SMTP_HOST`, `SMTP_PORT`, and `EMAIL_SERVICE`.
The code keeps the authenticated sender configured by `EMAIL_USER` and sets
`Reply-To` to `contact@smartnshine.in`; changing public support links does not
create or authenticate a mailbox.

The Settings model's support email default is updated for new settings records.
If an existing database Settings record has the old address, update its
`contactEmail` through the admin settings interface.

## OAuth providers

Register these callback URLs in the corresponding provider configuration before
switching `SERVER_URL`:

- Google: `https://api.smartnshine.in/api/auth/google/callback`
- GitHub: `https://api.smartnshine.in/api/auth/github/callback`

Where the provider uses a frontend origin or homepage URL, use
`https://www.smartnshine.in`. Retain old callbacks where supported until old
domain traffic has been migrated.

## Verify after deployment

- Both public domain variants reach the production site over HTTPS.
- API calls from the new frontend succeed without CORS errors.
- Google/GitHub login returns to the new frontend.
- Password reset emails link to the new frontend and replies target the new mailbox.
- Published sitemap, canonical URLs, and contact links use the new domain.

Local source changes do not update provider dashboards or deploy the app.
