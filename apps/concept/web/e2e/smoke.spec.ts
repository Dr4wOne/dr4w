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
  // The jump is over in under a second, so listen for it instead of polling the attribute.
  const jumped = page.evaluate(
    () =>
      new Promise((done) =>
        document.querySelector('dr4w-rig')?.addEventListener('rigstate', (e) => {
          if ((e as CustomEvent).detail.state === 'jump') done(true)
        }),
      ),
  )
  await page.getByRole('button', { name: 'Jump', exact: true }).click()
  expect(await jumped).toBe(true)
})

test('direct execute-api calls without the origin secret are rejected', async ({ request }) => {
  test.skip(!process.env.API_URL, 'API_URL not set')
  const res = await request.get(`${process.env.API_URL}/api/anything`)
  expect(res.status()).toBe(403)
})
