import dns from 'node:dns/promises'
import { DEFAULT_DOMAIN } from '@repo/shared'

const disallowedHostnames = new Set([
  DEFAULT_DOMAIN,
  'localhost'
])

function stripTrailingDot(value: string) {
  return value.replace(/\.+$/, '')
}

export function isApexLikeHostname(hostname: string) {
  return hostname.split('.').length <= 2
}

export function normalizeHostname(value: string) {
  const normalized = stripTrailingDot(value.trim().toLowerCase())

  if (!normalized) {
    throw new Error('Hostname is required')
  }

  if (normalized.includes('://') || normalized.includes('/')) {
    throw new Error('Enter only the hostname')
  }

  if (normalized.includes(':')) {
    throw new Error('Ports are not allowed in custom domains')
  }

  if (normalized.startsWith('*.')) {
    throw new Error('Wildcard custom domains are not supported')
  }

  if (disallowedHostnames.has(normalized)) {
    throw new Error('This hostname cannot be used as a custom domain')
  }

  if (
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal') ||
    normalized.endsWith('.arpa') ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.test') ||
    normalized.endsWith('.example')
  ) {
    throw new Error('This hostname cannot be used as a custom domain')
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalized)) {
    throw new Error('Use a hostname instead of a raw IP address')
  }

  if (!/^(?=.{1,191}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(normalized)) {
    throw new Error('Enter a valid hostname such as go.example.com')
  }

  if (isApexLikeHostname(normalized)) {
    throw new Error('Use a subdomain such as go.example.com instead of the root domain')
  }

  return normalized
}

export function stripPortFromHost(value: string | null | undefined) {
  if (!value) return null
  const trimmed = value.trim()

  if (!trimmed) return null

  if (trimmed.startsWith('[')) {
    const endBracket = trimmed.indexOf(']')
    if (endBracket === -1) return trimmed.toLowerCase()
    return trimmed.slice(1, endBracket).toLowerCase()
  }

  const parts = trimmed.split(':')
  return parts[0]?.toLowerCase() ?? null
}

function configuredHostname(value: string) {
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return stripPortFromHost(value)
  }
}

export function isDefaultShortDomain(hostname: string | null, configuredHosts: string[]) {
  if (!hostname) return true

  return configuredHosts
    .map((host) => configuredHostname(host))
    .filter((host): host is string => Boolean(host))
    .includes(hostname)
}

export function expectedDomainTargetHost() {
  if (process.env.CUSTOM_DOMAIN_TARGET_HOST) {
    return process.env.CUSTOM_DOMAIN_TARGET_HOST.toLowerCase()
  }

  try {
    return new URL(process.env.API_URL || '').hostname.toLowerCase()
  } catch {
    return null
  }
}

export async function resolveDnsDiagnostics(hostname: string) {
  const [cnameRecords, aRecords, aaaaRecords] = await Promise.all([
    dns.resolveCname(hostname).catch(() => [] as string[]),
    dns.resolve4(hostname).catch(() => [] as string[]),
    dns.resolve6(hostname).catch(() => [] as string[])
  ])

  return {
    cnameRecords: cnameRecords.map((value) => value.toLowerCase()),
    aRecords,
    aaaaRecords
  }
}

export async function resolveTargetDiagnostics(targetHost: string | null) {
  if (!targetHost) {
    return {
      cnameRecords: [] as string[],
      aRecords: [] as string[],
      aaaaRecords: [] as string[]
    }
  }

  return resolveDnsDiagnostics(targetHost)
}

function hasIpOverlap(values: string[], expected: string[]) {
  if (values.length === 0 || expected.length === 0) {
    return false
  }

  return values.some((value) => expected.includes(value))
}

export function pointsToExpectedTarget(
  dnsInfo: Awaited<ReturnType<typeof resolveDnsDiagnostics>>,
  targetInfo: Awaited<ReturnType<typeof resolveTargetDiagnostics>>,
  targetHost: string | null
) {
  if (!targetHost) {
    return true
  }

  if (
    dnsInfo.cnameRecords.includes(targetHost) ||
    dnsInfo.cnameRecords.some((record) => record.endsWith(`.${targetHost}`))
  ) {
    return true
  }

  return (
    hasIpOverlap(dnsInfo.aRecords, targetInfo.aRecords) ||
    hasIpOverlap(dnsInfo.aaaaRecords, targetInfo.aaaaRecords)
  )
}
