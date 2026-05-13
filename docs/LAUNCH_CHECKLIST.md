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
