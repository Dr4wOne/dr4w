import { expect, test } from '@playwright/test'

// Runs after every deploy (.github/workflows/deploy.yml).

test('API is healthy through the Worker', async ({ request }) => {
  const res = await request.get('/api/health')
  expect(res.status()).toBe(200)
  expect(await res.json()).toMatchObject({ ok: true })
})

test('the app renders the title lockup', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DR4WIRON HUNT')
})

test('DR4W can be played from the on-screen pad', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Jump', exact: true }).click()
  await expect(page.locator('dr4w-rig .dr4w')).toHaveAttribute('data-state', /jump|fall|land/)
})

test('direct execute-api calls without the origin secret are rejected', async ({ request }) => {
  test.skip(!process.env.API_URL, 'API_URL not set')
  const res = await request.get(`${process.env.API_URL}/api/anything`)
  expect(res.status()).toBe(403)
})
