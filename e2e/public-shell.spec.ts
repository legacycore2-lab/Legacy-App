import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://e2e.supabase.local/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
  })
})

test('unauthenticated users are redirected to the login page', async ({ page }) => {
  await page.goto('#/')

  await expect(page).toHaveURL(/#\/login$/)
  await expect(page.locator('form.login-form')).toBeVisible()
})

test('login form exposes its critical controls', async ({ page }) => {
  await page.goto('#/login')

  await expect(page.locator('#login-email')).toHaveAttribute('type', 'email')
  await expect(page.locator('#login-password')).toHaveAttribute('type', 'password')
  await expect(page.locator('button[type="submit"]')).toBeEnabled()
})

test('password visibility control is keyboard accessible', async ({ page }) => {
  await page.goto('#/login')
  const password = page.locator('#login-password')
  const reveal = page.locator('.login-form__reveal')

  await reveal.focus()
  await page.keyboard.press('Enter')
  await expect(password).toHaveAttribute('type', 'text')
  await page.keyboard.press('Enter')
  await expect(password).toHaveAttribute('type', 'password')
})
