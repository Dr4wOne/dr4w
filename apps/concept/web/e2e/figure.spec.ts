import { expect, test } from '@playwright/test'

const rigState = (page: import('@playwright/test').Page) =>
  page.locator('dr4w-rig .dr4w').getAttribute('data-state')

test('the rig plays from the keyboard: move, run, jump, dash, charge, shoot', async ({ page }) => {
  await page.goto('/')
  const stage = page.locator('.rig-stage')
  await stage.focus()
  await page.keyboard.down('ArrowRight')
  await expect.poll(() => rigState(page)).toMatch(/walk|run/)
  await expect.poll(() => rigState(page), { timeout: 3000 }).toBe('run')
  await page.keyboard.up('ArrowRight')
  await expect.poll(() => rigState(page)).toBe('idle')
  await page.keyboard.press('Space')
  await expect.poll(() => rigState(page)).toMatch(/jump|fall|land/)
  await expect.poll(() => rigState(page)).toBe('idle')
  await page.keyboard.press('Shift')
  await expect.poll(() => rigState(page)).toMatch(/dash|idle/)
  await page.keyboard.down('f')
  await expect.poll(() => rigState(page)).toBe('charge')
  await page.keyboard.up('f')
  await expect.poll(() => rigState(page)).toMatch(/shoot|idle/)
})

test('arrow keys outside the room still scroll the page', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('PageDown')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  expect(await rigState(page)).toBe('idle')
})

test('a #fig-cannon deep link opens the arm cannon; ] switches to the next figure', async ({
  page,
}) => {
  await page.goto('/#fig-cannon')
  await expect(page.locator('#fig-cannon')).toBeVisible()
  await expect(page.locator('#fig-dr4w')).toBeHidden()
  await page.locator('[data-fig="cannon"]').focus()
  await page.keyboard.press(']')
  await expect(page.locator('#fig-tube')).toBeVisible()
  await expect(page).toHaveURL(/#fig-tube$/)
})

test('device parts operate: the cannon charges and fires, the tube wakes DR4W', async ({
  page,
}) => {
  await page.goto('/#fig-cannon')
  const cannon = page.locator('dr4w-cannon')
  const charge = cannon.getByRole('button', { name: 'Charge and fire' })
  await charge.dispatchEvent('pointerdown')
  await expect(cannon).toHaveAttribute('data-charge', 'charging')
  await charge.dispatchEvent('pointerup')
  await expect(cannon).toHaveAttribute('data-charge', /fired|ready/)
  await page.goto('/#fig-tube')
  const tube = page.locator('dr4w-tube')
  await tube.getByRole('button', { name: 'Wake' }).click()
  await tube.getByRole('button', { name: 'Wake' }).click()
  await expect(tube).toHaveAttribute('data-wake', 'awake')
})

test('reduced motion stops every keyframe animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Jump', exact: true }).click()
  const running = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => a instanceof CSSAnimation && a.playState === 'running')
        .length,
  )
  expect(running).toBe(0)
})

test('the first screen at 375×667 shows the start action and DR4W', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  const start = await page.getByRole('button', { name: /Press start/ }).boundingBox()
  const rig = await page.locator('.rig-body').boundingBox()
  expect(start && start.y + start.height <= 667).toBe(true)
  expect(rig && rig.y < 667).toBe(true)
})

test('no element runs past the viewport edge on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const wide = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(wide).toBeLessThanOrEqual(390)
})

test('the stage map selects a chapter and the archive opens a lightbox', async ({ page }) => {
  await page.goto('/#hunt')
  await page.getByRole('button', { name: /Purge Core/ }).click()
  await expect(page.locator('#stage-card h3')).toHaveText('Purge Core')
  await page.getByRole('button', { name: 'Open: Title screen' }).click()
  await expect(page.locator('dialog.lightbox')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('dialog.lightbox')).toBeHidden()
})

test('no Portuguese and no antenna call to action on the page (D3, D4)', async ({ page }) => {
  await page.goto('/')
  const text = await page.locator('body').innerText()
  expect(text).not.toMatch(/UNIDADE|PROTOCOLO|MISSÃO|FUNÇÃO|OBEDECER|ESCOLHA|CAÇAR/)
  expect(text).not.toMatch(/Tune the antenna|Listen/)
})
