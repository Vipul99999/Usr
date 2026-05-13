import { test, expect } from '@playwright/test'

const hasCredentials = Boolean(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD)

test.describe('link creation flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasCredentials, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run authenticated browser tests.')

    await page.goto('/login')
    await page.getByLabel('Email').fill(process.env.E2E_USER_EMAIL || '')
    await page.getByLabel('Password').fill(process.env.E2E_USER_PASSWORD || '')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('user can create and clean up a link from the links workspace', async ({ page }) => {
    const uniqueId = Date.now().toString()
    const title = `Launch Flow ${uniqueId}`
    const slug = `launch-flow-${uniqueId}`

    await page.goto('/dashboard/links')

    await page.getByLabel('Title').fill(title)
    await page.getByLabel('Destination URL').fill('https://example.com/launch-flow')
    await page.getByLabel('Custom slug').fill(slug)
    await page.getByLabel('Campaign').fill('launch-e2e')

    await page.getByRole('button', { name: /^create link$/i }).click()

    await expect(page.getByText(/link created successfully/i)).toBeVisible()
    await expect(page.getByText(title)).toBeVisible()
    await expect(page.getByText(new RegExp(slug))).toBeVisible()

    await page.getByPlaceholder('Search links or tags').fill(title)
    await page.getByRole('button', { name: /delete/i }).first().click()
    await page.getByRole('button', { name: /delete link/i }).click()

    await expect(page.getByText(/link deleted/i)).toBeVisible()
  })
})
