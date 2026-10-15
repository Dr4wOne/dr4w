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

test('a note can be created and deleted', async ({ page }) => {
  const title = `smoke ${Date.now()}`
  await page.goto('/')
  await page.getByLabel('Title').fill(title)
  await page.getByRole('button', { name: 'Add note' }).click()
  await expect(page.getByText(title)).toBeVisible()
  await page.getByLabel(`Delete ${title}`).click()
  await expect(page.getByText(title)).toHaveCount(0)
})
