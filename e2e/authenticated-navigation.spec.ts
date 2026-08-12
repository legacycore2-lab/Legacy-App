import { expect, test } from '@playwright/test'

const accessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6ImUyZS1hZG1pbiJ9.signature'

const session = {
  access_token: accessToken,
  refresh_token: 'e2e-refresh-token',
  expires_in: 3600,
  expires_at: 4102444800,
  token_type: 'bearer',
  user: {
    id: 'e2e-admin',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'admin@legacy.local',
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    phone: '',
    confirmed_at: '2026-01-01T00:00:00.000Z',
    last_sign_in_at: '2026-01-01T00:00:00.000Z',
    app_metadata: { provider: 'email', providers: ['email'], role: 'admin' },
    user_metadata: { full_name: 'E2E Admin' },
    identities: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    is_anonymous: false,
  },
}

const protectedPaths = ['/', '/projects', '/journal', '/banks', '/reports']

test.beforeEach(async ({ page }) => {
  await page.addInitScript((storedSession) => {
    window.localStorage.setItem('sb-e2e-auth-token', JSON.stringify(storedSession))
  }, session)

  await page.route('https://e2e.supabase.local/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (url.pathname.includes('/auth/v1/token')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(session),
      })
      return
    }

    if (url.pathname.includes('/auth/v1/user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(session.user),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': '0-0/0' },
      body: JSON.stringify([]),
    })
  })
})

for (const path of protectedPaths) {
  test(`admin session can open ${path}`, async ({ page }) => {
    await page.goto(`#${path}`)

    await expect(page).not.toHaveURL(/#\/login$/)
    await expect(page.locator('.app-layout')).toBeVisible()
    await expect(page.locator('.page-content')).toBeVisible()
  })
}
