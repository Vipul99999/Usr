# Cloudflare + Vercel + Render Stack

This is the recommended startup launch stack for this project.

## Why this stack

- `Cloudflare` handles DNS, CDN, WAF, rate shaping, TLS, and branded-domain edge entry.
- `Vercel` runs the marketing site and product dashboard well.
- `Render` runs the Fastify API and the worker with simple operational ergonomics.
- `Cloudflare R2` keeps export storage cheap and globally reachable.
- `Managed Redis` provides shared cache and abuse-defense state across API instances.

## Production topology

```text
User
  -> Cloudflare
    -> Vercel (web)
    -> Render API
    -> Render Worker (private/background)
  -> Managed PostgreSQL
  -> Managed Redis
  -> Cloudflare R2
  -> Resend
  -> Sentry
```

## Recommended hostnames

- App: `app.yourdomain.com`
- API: `api.yourdomain.com`
- Short-domain target: `go.yourdomain.com`

Custom customer domains should point to `go.yourdomain.com`.

## Cloudflare setup

1. Add your root domain to Cloudflare.
2. Create DNS records:
   - `app` -> Vercel target
   - `api` -> Render API host
   - `go` -> Render API host or your chosen edge hostname
3. Enable proxying for public traffic.
4. Turn on:
   - Always Use HTTPS
   - Automatic HTTPS Rewrites
   - Brotli
   - basic WAF managed rules
   - bot fight mode or equivalent if available for your plan
5. Add rate rules for:
   - `/auth/login`
   - `/.well-known/url-shortener-domain-verification`
   - public redirect paths if abuse rises

## Vercel setup

Deploy `apps/web`.

Required envs:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SHORT_URL_BASE=https://go.yourdomain.com
NEXT_PUBLIC_CUSTOM_DOMAIN_TARGET_HOST=go.yourdomain.com
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```

Optional server env on Vercel:

```env
APP_URL=https://app.yourdomain.com
```

## Render API setup

Deploy `apps/api` as a web service.

Required envs:

```env
NODE_ENV=production
PORT=4000
APP_URL=https://app.yourdomain.com
API_URL=https://api.yourdomain.com
CUSTOM_DOMAIN_TARGET_HOST=go.yourdomain.com
DATABASE_URL=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
OBJECT_STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=
R2_PUBLIC_BASE_URL=
EMAIL_PROVIDER=resend
MAIL_FROM=noreply@yourdomain.com
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
SENTRY_DSN=
ALERT_WEBHOOK_URL=
ALERT_WEBHOOK_BEARER_TOKEN=
```

## Render Worker setup

Deploy `apps/worker` as a worker service.

It must share:

- `DATABASE_URL`
- `REDIS_URL`
- object storage envs
- email envs
- Sentry envs

Worker-only envs:

```env
JOB_POLL_INTERVAL_MS=1000
JOB_STALE_LOCK_TIMEOUT_MS=300000
WORKER_ERROR_BACKOFF_MS=5000
WORKER_HEALTH_HOST=0.0.0.0
WORKER_HEALTH_PORT=4010
```

## R2 setup

1. Create one bucket for exports.
2. Generate an access key pair scoped to that bucket.
3. Set:
   - `OBJECT_STORAGE_PROVIDER=r2`
   - `R2_BUCKET`
   - `R2_ENDPOINT`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
4. Set `R2_PUBLIC_BASE_URL` only if you expose downloads via a public/custom domain path.

## Redis setup

Use a managed Redis that supports TLS if possible.

Why it matters here:

- redirect cache
- shared login lockouts
- shared invalid API-key lockouts
- reconnect-safe runtime behavior

## Launch validation

Before you announce the product:

1. Check `https://api.yourdomain.com/health`
2. Check worker `/health`
3. Create a short link on `app.yourdomain.com`
4. Visit a short link on `go.yourdomain.com`
5. Confirm analytics arrive
6. Queue an export and download it
7. Create an API key and hit one scoped route
8. Add one real custom domain and confirm diagnostics show it as safe to serve

## Cloudflare rules worth adding early

- challenge or rate-limit repeated invalid slug probes
- challenge repetitive auth failures
- block obviously bad countries only if your market allows it
- create an emergency rule for a single abusive IP range

## Reality check

This stack is intentionally startup-friendly:

- cheap enough to launch
- strong enough for early traction
- easy to evolve later into stronger edge routing or more services
