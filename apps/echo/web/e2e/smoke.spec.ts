import { expect, test } from '@playwright/test'

// Runs after every deploy (.github/workflows/deploy.yml).

test('API is healthy through the Worker', async ({ request }) => {
  const res = await request.get('/api/health')
  expect(res.status()).toBe(200)
  expect(await res.json()).toMatchObject({ ok: true })
})

test('the app renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('direct execute-api calls without the origin secret are rejected', async ({ request }) => {
  test.skip(!process.env.API_URL, 'API_URL not set')
  const res = await request.get(`${process.env.API_URL}/api/anything`)
  expect(res.status()).toBe(403)
})

test('the count endpoint answers through the Worker', async ({ request }) => {
  const res = await request.get('/api/count')
  expect(res.status()).toBe(200)
  expect(typeof (await res.json()).count).toBe('number')
})
