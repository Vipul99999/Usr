# Go-Live Cutover: Cloudflare + Vercel + Render + Upstash + R2

This is the practical cutover sequence for the recommended startup stack.

## Production hostnames

- `app.yourdomain.com` -> Vercel web
- `api.yourdomain.com` -> Render API
- `go.yourdomain.com` -> Cloudflare-proxied short-link domain pointing to the API/redirect layer

## Pre-cutover checks

- [ ] Vercel deployment is healthy for the web app
- [ ] Render API deployment is healthy
- [ ] Render worker deployment is healthy
- [ ] Postgres is reachable and migrations are ready
- [ ] Upstash Redis URL is configured
- [ ] R2 credentials are configured
- [ ] Resend or SMTP provider is configured
- [ ] Sentry DSNs and alert webhook are configured

## DNS records

Create or confirm:

- `app` CNAME -> Vercel target
- `api` CNAME -> Render target
- `go` CNAME -> Render target or your chosen edge hostname

Cloudflare:

- proxy enabled for `app`, `api`, and `go`
- SSL mode appropriate for your origin setup
- Always Use HTTPS enabled
- WAF managed rules enabled

## Environment mapping

### Web

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SHORT_URL_BASE=https://go.yourdomain.com
NEXT_PUBLIC_CUSTOM_DOMAIN_TARGET_HOST=go.yourdomain.com
NEXT_PUBLIC_SENTRY_DSN=
```

### API

```env
APP_URL=https://app.yourdomain.com
API_URL=https://api.yourdomain.com
CUSTOM_DOMAIN_TARGET_HOST=go.yourdomain.com
DATABASE_URL=
REDIS_URL=
OBJECT_STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=
R2_PUBLIC_BASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
EMAIL_PROVIDER=resend
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
SENTRY_DSN=
ALERT_WEBHOOK_URL=
```

### Worker

```env
DATABASE_URL=
REDIS_URL=
OBJECT_STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=
R2_PUBLIC_BASE_URL=
EMAIL_PROVIDER=resend
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
SENTRY_DSN=
JOB_POLL_INTERVAL_MS=1000
JOB_STALE_LOCK_TIMEOUT_MS=300000
WORKER_ERROR_BACKOFF_MS=5000
```

## Cutover order

1. Deploy web.
2. Deploy API.
3. Deploy worker.
4. Run `pnpm db:deploy`.
5. Confirm API `/health` and `/ready`.
6. Confirm worker `/health` and `/ready`.
7. Enable Cloudflare proxy rules for public traffic.
8. Run the smoke test.
9. Create one real short link on `go.yourdomain.com`.
10. Create one named campaign and open its report.

## Immediate post-cutover checks

- [ ] Login works on `app.yourdomain.com`
- [ ] Link creation works
- [ ] Redirect works on `go.yourdomain.com`
- [ ] Analytics update after a redirect
- [ ] Export queue and download work
- [ ] Campaign report and weekly summary load
- [ ] One custom domain can be added and diagnosed
- [ ] Security center loads without major alerts

## Rollback trigger points

Pause launch if:

- redirects fail
- `/ready` is degraded
- worker dead-letter queue grows unexpectedly
- exports fail repeatedly
- analytics stop updating
- Cloudflare rules break auth or redirect traffic

## First-day operator habit

Every few hours, check:

- `/ready`
- dashboard overview
- security center
- dead-letter jobs
- export backlog
- domain drift
- Upstash command usage
- Sentry issue volume
