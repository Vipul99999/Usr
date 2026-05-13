# Cloudflare DNS and WAF Rules

Use this as the practical baseline for launching UrlShortener behind Cloudflare.

## DNS records

Create these DNS entries:

- `app.yourdomain.com`
  - target: your Vercel hostname
  - proxy: enabled
- `api.yourdomain.com`
  - target: your Render API hostname
  - proxy: enabled
- `go.yourdomain.com`
  - target: your Render API hostname or chosen edge hostname
  - proxy: enabled

Customer-branded short-link domains should usually be:

- `go.customerdomain.com`
  - type: `CNAME`
  - target: `go.yourdomain.com`

## SSL/TLS

Set:

- SSL/TLS mode: `Full (strict)`
- Always Use HTTPS: `On`
- Automatic HTTPS Rewrites: `On`
- Minimum TLS version: `1.2`

## Core Cloudflare features

Turn on:

- proxying for all public app/API/redirect hostnames
- Brotli
- HTTP/3
- managed WAF rules
- bot protection if available on your plan

## Rate limiting rules

### 1. Login protection

Path:

- `/auth/login`

Suggested rule:

- threshold: `10 requests`
- period: `1 minute`
- action: `Managed Challenge`

### 2. Password reset / verification abuse

Paths:

- `/auth/forgot-password`
- `/auth/resend-verification`
- `/auth/refresh`

Suggested rule:

- threshold: `20 requests`
- period: `5 minutes`
- action: `Managed Challenge`

### 3. Custom-domain verification probing

Path:

- `/.well-known/url-shortener-domain-verification`

Suggested rule:

- threshold: `30 requests`
- period: `10 minutes`
- action: `Managed Challenge`

### 4. Redirect flood control

Target:

- public redirect traffic on `go.yourdomain.com`
- customer-branded hostnames routed through Cloudflare

Suggested rule:

- threshold: `300 requests`
- period: `1 minute`
- action: `Managed Challenge`

Important:

- keep this relaxed enough to avoid harming real campaign spikes
- tighten only after observing actual traffic patterns

### 5. Invalid slug probing emergency rule

Use when you see lots of `404` redirect lookups or abuse signals.

Suggested temporary rule:

- if one IP hits high-volume misses on redirect hosts
- action: `Block` or `Managed Challenge`

## WAF expression ideas

### Auth challenge

Apply challenge when:

- hostname is `api.yourdomain.com`
- path starts with `/auth/`
- request rate exceeds normal thresholds

### Redirect protection

Apply challenge when:

- hostname is `go.yourdomain.com`
- bot score is poor
- requests are repetitive
- path volume is abnormal

### Verification route protection

Apply challenge when:

- path equals `/.well-known/url-shortener-domain-verification`
- request country, bot score, or rate looks suspicious

## Cache guidance

Do not aggressively cache:

- `/auth/*`
- `/workspaces/*`
- `/users/*`
- `/webhooks/*`

You may later use Cloudflare performance features for:

- the marketing site
- static Next.js assets

Public redirect responses should usually remain origin-driven unless you intentionally build edge redirect caching later.

## Logging and observability

Before launch:

- enable Cloudflare analytics
- enable security events visibility
- make sure you can inspect challenged and blocked traffic

During first traffic:

- compare Cloudflare events with the in-app security center
- tune challenge rules, not just block rules

## What “good enough” looks like for launch

For a startup launch, this is enough:

- all public traffic proxied through Cloudflare
- managed WAF enabled
- auth rate rule enabled
- verification route protected
- redirect host protected with a soft challenge rule

You do not need a giant enterprise ruleset on day one. You need safe defaults and the ability to tighten fast.
