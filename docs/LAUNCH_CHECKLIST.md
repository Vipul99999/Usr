# Launch Checklist

This is the final startup-launch checklist for UrlShortener.

Use it as the go / no-go list before public release.

## 1. Product Readiness

- [ ] Landing page reflects real product positioning
- [ ] Login, register, forgot-password, resend-verification, and reset-password flows work
- [ ] Dashboard loads for a fresh user
- [ ] Link creation, copy, QR, export, and delete flows work
- [ ] Analytics overview shows live data after redirects
- [ ] Invitation flow works end to end
- [ ] Custom domain flow works on a real hostname with HTTPS
- [ ] API keys can be created, used, and revoked

## 2. Backend Readiness

- [ ] `npm run build` passes
- [ ] `npm run test` passes
- [ ] `pnpm db:deploy` applies cleanly in the target environment
- [ ] API `/health` returns `200`
- [ ] API `/ready` returns `200`
- [ ] Worker `/health` returns `200`
- [ ] Worker `/ready` returns `200`
- [ ] Redis is connected in production
- [ ] Object storage is connected in production
- [ ] Email provider is configured

## 3. Security Readiness

- [ ] Strong production JWT secrets are set
- [ ] `APP_URL` and `API_URL` use HTTPS
- [ ] Redis is not publicly exposed
- [ ] Postgres is not publicly exposed
- [ ] API keys are scoped and reviewed
- [ ] Alert webhook is configured
- [ ] Sentry DSNs are configured
- [ ] CDN / WAF sits in front of public redirect traffic
- [ ] Backup strategy exists for Postgres and object storage

## 4. Infrastructure Readiness

- [ ] Managed PostgreSQL is provisioned
- [ ] Managed Redis is provisioned
- [ ] Cloudflare R2 bucket is provisioned
- [ ] Web, API, and worker are deployed as separate services
- [ ] Worker has restart policy enabled
- [ ] Logs are collected centrally
- [ ] Uptime monitoring is enabled for web, API, and worker

## 4.1 Recommended Startup Stack Validation

Use this if you are deploying the recommended stack:

- `Cloudflare` for DNS, CDN, SSL, and WAF
- `Vercel` for web
- `Render` for API
- `Render` for worker
- `Upstash Redis` for cache
- `Cloudflare R2` for export storage

Before launch, confirm:

- [ ] `app.yourdomain.com` resolves to Vercel and serves over HTTPS
- [ ] `api.yourdomain.com` resolves to Render and serves over HTTPS
- [ ] `go.yourdomain.com` is routed through Cloudflare and reaches the redirect layer correctly
- [ ] Cloudflare proxying is enabled for public app/api/short domains
- [ ] Cloudflare WAF / rate-limit rules are enabled for auth and redirect abuse
- [ ] Upstash `REDIS_URL` is configured and `/ready` does not show degraded cache reasons
- [ ] R2 bucket credentials are configured and object storage provider reports `r2`
- [ ] Worker service is deployed separately and its `/health` endpoint is live
- [ ] Email provider webhook is reachable from the public internet
- [ ] Production secrets are set separately for web, API, and worker

## 5. Browser Validation

Run:

```bash
pnpm test:e2e
```

Required envs:

```env
E2E_BASE_URL=
E2E_USER_EMAIL=
E2E_USER_PASSWORD=
```

Expected coverage:

- public landing and auth screens
- dashboard shell
- links workspace
- campaign hub and weekly report views
- settings/custom domain guidance
- authenticated link creation flow

## 6. Final Smoke Test

Do this on the deployed environment:

1. Register a user
2. Verify email
3. Log in
4. Create a short link
5. Visit the short link
6. Confirm analytics update
7. Queue and download an export
8. Add and verify a custom domain
9. Create and test an API key
10. Confirm no Sentry flood or worker backlog
11. Create one named campaign and open its weekly summary
12. Queue one campaign-specific export

Or run the scripted version:

```bash
pnpm smoke:prod
```

Required envs:

```env
SMOKE_BASE_URL=https://go.yourdomain.com
SMOKE_API_URL=https://api.yourdomain.com
SMOKE_USER_EMAIL=
SMOKE_USER_PASSWORD=
```

## 7. Launch Decision

Launch if:

- builds pass
- runtime tests pass
- browser flows pass
- production smoke test passes
- backups and monitoring are live

Delay launch if:

- redirects fail or lag badly
- worker is not reliable
- custom domains are unverified
- exports are broken
- monitoring is missing
- Cloudflare/WAF rules are not in place for auth and redirect traffic

## 8. First 24 Hours After Launch

- [ ] Watch API `/ready` for degraded reasons
- [ ] Watch worker `/health` for failed jobs or loop errors
- [ ] Watch the dashboard security center for:
  - [ ] dead-letter jobs
  - [ ] retry build-up
  - [ ] domain drift
  - [ ] abuse signals
- [ ] Confirm at least one real link receives clicks and analytics update correctly
- [ ] Confirm no email delivery failures are stacking up
- [ ] Confirm no export jobs are stuck in `PENDING` / `PROCESSING`
- [ ] Confirm one campaign report and one shareable report page render correctly
- [ ] Check Upstash command usage and adjust cache limits only if needed
- [ ] Review Cloudflare analytics and tighten WAF rules from real traffic, not guesses
