const baseUrl = process.env.SMOKE_BASE_URL
const apiUrl = process.env.SMOKE_API_URL
const email = process.env.SMOKE_USER_EMAIL
const password = process.env.SMOKE_USER_PASSWORD

if (!baseUrl || !apiUrl || !email || !password) {
  console.error(
    'Missing required envs. Set SMOKE_BASE_URL, SMOKE_API_URL, SMOKE_USER_EMAIL, and SMOKE_USER_PASSWORD.'
  )
  process.exit(1)
}

function trimSlash(value) {
  return value.replace(/\/+$/, '')
}

async function expectOk(response, label) {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${label} failed: ${response.status} ${text}`)
  }

  return response
}

async function main() {
  const cleanBase = trimSlash(baseUrl)
  const cleanApi = trimSlash(apiUrl)

  console.log(`Smoke check starting for ${cleanBase} and ${cleanApi}`)

  await expectOk(await fetch(`${cleanApi}/health`), 'API /health')
  await expectOk(await fetch(`${cleanApi}/ready`), 'API /ready')

  const loginResponse = await expectOk(
    await fetch(`${cleanApi}/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    }),
    'Login'
  )

  const login = await loginResponse.json()
  const token = login.accessToken
  const workspaceId = login.workspaceId

  if (!token || !workspaceId) {
    throw new Error('Login response did not include accessToken/workspaceId')
  }

  await expectOk(
    await fetch(`${cleanApi}/users/me`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    }),
    'Current user'
  )

  const slug = `smoke-${Date.now()}`
  const linkResponse = await expectOk(
    await fetch(`${cleanApi}/workspaces/${workspaceId}/links`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        slug,
        destinationUrl: 'https://example.com',
        title: 'Production smoke link'
      })
    }),
    'Create link'
  )

  const createdLink = await linkResponse.json()
  const shortUrl = `${cleanBase}/${createdLink.slug}`
  const redirectResponse = await fetch(shortUrl, {
    redirect: 'manual'
  })

  if (![301, 302, 307, 308].includes(redirectResponse.status)) {
    throw new Error(`Redirect check failed: expected redirect, got ${redirectResponse.status}`)
  }

  await expectOk(
    await fetch(`${cleanApi}/workspaces/${workspaceId}/analytics/overview`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    }),
    'Analytics overview'
  )

  await expectOk(
    await fetch(`${cleanApi}/workspaces/${workspaceId}/ops/overview`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    }),
    'Ops overview'
  )

  console.log('Smoke check passed.')
  console.log(`Created test link slug: ${createdLink.slug}`)
  console.log(`Redirect status: ${redirectResponse.status}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
