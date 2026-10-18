import { expect, test } from '@playwright/test'

test('the gear works from the keyboard alone', async ({ page }) => {
  await page.goto('/')
  const antenna = page.locator('#gear-antenna')
  await antenna.focus()
  await page.keyboard.press('Enter')
  await expect(antenna).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#gear-core')).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#gear-cannon')).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.locator('dr4w-figure')).toHaveAttribute('data-cannon', 'charging')
  await page.keyboard.press('Escape')
  await expect(antenna).toHaveAttribute('aria-pressed', 'false')
})

test('a #gear-antenna link focuses and tunes the antenna', async ({ page }) => {
  await page.goto('/#gear-antenna')
  await expect(page.locator('#gear-antenna')).toBeFocused()
  await expect(page.locator('dr4w-figure')).toHaveAttribute('data-antenna', 'listening')
  await page.getByRole('link', { name: 'Listen' }).click()
  await expect(page.locator('#gear-antenna')).toBeFocused()
})

// Opacity fades stay (instant state swap + fade); keyframe motion must stop.
test('reduced motion stops every figure animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('#gear-antenna').click()
  const running = await page.evaluate(
    () =>
      document
        .querySelector('dr4w-figure')
        ?.getAnimations({ subtree: true })
        .filter((a) => a instanceof CSSAnimation).length,
  )
  expect(running).toBe(0)
})

test('the first screen holds the figure and the action at phone size', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  for (const loc of [
    page.locator('#gear-antenna'),
    page.getByRole('link', { name: 'Tune the antenna' }),
  ]) {
    const box = await loc.boundingBox()
    expect(box && box.y + box.height <= 667).toBe(true)
  }
})
