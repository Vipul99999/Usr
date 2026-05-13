import { test, expect } from '@playwright/test'

test.describe('public marketing and auth pages', () => {
  test('landing page shows core value and primary actions', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: /short links that look sharp/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /create your first short link/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /view dashboard preview/i })).toBeVisible()
    await expect(page.getByText(/trusted by growing teams/i)).toBeVisible()
  })

  test('login page shows trust cues and recovery links', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /log in to your workspace/i })).toBeVisible()
    await expect(page.getByText(/redis-backed/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /resend verification/i })).toBeVisible()
  })

  test('register page shows onboarding guidance', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: /launch your link workspace/i })).toBeVisible()
    await expect(page.getByText(/3 minute setup/i)).toBeVisible()
    await expect(page.getByText(/best first workflow/i)).toBeVisible()
  })

  test('forgot-password and resend-verification pages load polished states', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('heading', { name: /reset access without losing momentum/i })).toBeVisible()
    await expect(page.getByText(/no account leakage/i)).toBeVisible()

    await page.goto('/resend-verification')
    await expect(page.getByRole('heading', { name: /keep onboarding moving/i })).toBeVisible()
    await expect(page.getByText(/safer flow/i)).toBeVisible()
  })
})
