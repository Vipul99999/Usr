# First Traffic Playbook

This is the startup founder playbook for the first real users and first real spikes.

## Goal

Keep trust high during the first days after launch.

You are watching for:

- redirect failures
- auth abuse
- worker backlog
- custom-domain drift
- API key misuse
- unexpected export failures

## What to watch immediately after launch

### Every 15 to 30 minutes on day 1

Check:

- API `/health`
- API `/ready`
- worker `/health`
- worker `/ready`
- Sentry
- Cloudflare security events
- in-app security center

## Dashboard checks

Open:

- `/dashboard`
- `/dashboard/settings`
- `/dashboard/security`

Watch for:

- recent abuse signals growing quickly
- domain drift alerts
- failed exports
- suspicious API-key traffic

## Cloudflare checks

Check:

- challenged requests
- blocked requests
- bot-heavy IPs
- auth-route spikes
- redirect-host spikes

## Worker checks

Watch for:

- growing pending jobs
- stale `PROCESSING` jobs
- delayed click analytics
- delayed email sending
- export failures

## First response actions

### If login abuse appears

1. tighten Cloudflare auth challenge rules
2. check the in-app abuse signals
3. confirm Redis-backed lockouts are still active

### If redirects are flooded

1. inspect Cloudflare events on `go.yourdomain.com`
2. add challenge on suspicious path patterns
3. extend IP or bot-based rules temporarily

### If branded links break

1. open `/dashboard/security`
2. inspect domain drift warnings
3. inspect `/dashboard/settings` diagnostics
4. disable the affected domain if needed

### If exports fail

1. inspect worker health
2. inspect object storage envs
3. inspect failed export count
4. retry after worker recovery

### If API key misuse appears

1. revoke the key
2. inspect recent API key request events
3. rotate the integration key
4. reduce scopes if the integration does not need them

## What to tighten after the first week

- stricter Cloudflare redirect challenge rules based on actual patterns
- better allow/deny lists for abusive IP ranges
- stronger alerts on job backlog
- more explicit customer-facing custom-domain help

## What not to overreact to

Do not immediately over-tighten rules if:

- you only see a small amount of bot traffic
- one export fails once
- one user misconfigures DNS

As a startup, the goal is stable learning, not panic hardening.
