import { test, expect } from '@playwright/test'

/**
 * The landing page's own defects (IVY-1205).
 *
 * <p>Three of these can only be caught in a browser: what a keyboard reaches,
 * whether controls in one row line up, and whether the page scrolls sideways
 * on a phone. The headline is here too because it is the first thing anybody
 * reads and it said the wrong word for months.
 */

test('the headline promises events, not invitations twice', async ({ page }) => {
  for (const [lang, tail] of [['mk', 'настани'], ['en', 'events'], ['sq', 'ngjarje']]) {
    await page.goto(`/${lang}`)
    const h1 = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ').trim()

    expect(h1, `${lang} headline`).toContain(tail)
    // "invitations … invitations" was the bug: the same noun ending both halves.
    const words = h1.toLowerCase().match(/[\p{L}]+/gu) || []
    const last = words[words.length - 1]
    expect(words.filter((w) => w === last).length, `${lang} repeats "${last}"`).toBe(1)
  }
})

test('a keyboard does not walk the hidden mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/mk')
  await page.evaluate(() => document.body.focus())

  const inHiddenMenu = []
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press('Tab')
    inHiddenMenu.push(await page.evaluate(() => Boolean(document.activeElement?.closest('nav.mobile-nav'))))
  }

  expect(inHiddenMenu.some(Boolean), 'focus entered the closed mobile menu').toBe(false)
})

test('the controls in the header row share a height and a corner', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/mk')

  const boxes = await page.evaluate(() =>
    ['.btn-outline', '.btn-fill', '.lang-toggle']
      .map((sel) => document.querySelector(sel))
      .filter(Boolean)
      .map((el) => ({
        height: Math.round(el.getBoundingClientRect().height),
        radius: getComputedStyle(el).borderTopLeftRadius,
      })))

  expect(boxes.length).toBeGreaterThan(1)
  expect(new Set(boxes.map((b) => b.height)).size, 'one height').toBe(1)
  expect(new Set(boxes.map((b) => b.radius)).size, 'one corner radius').toBe(1)
})

test('an available category can be chosen from the keyboard, an unavailable one cannot', async ({ page }) => {
  // Which categories are open is the server's to say; pinned here so the test
  // does not change meaning when a category ships.
  await page.route('**/v1/api/public/event-categories', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, message: null, data: [
      { category: 'WEDDING', order: 1, available: true, featured: true, tint: '', sample: { mk: 'Елена & Никола' }, types: ['WEDDING'] },
      { category: 'GRADUATION', order: 4, available: false, featured: false, tint: 'lav', sample: { mk: 'Генерација 2026' }, types: ['GRADUATION'] },
    ] }),
  }))
  await page.goto('/mk')
  const available = page.locator('.cat:not(.disabled)').first()
  const soon = page.locator('.cat.disabled').first()

  await expect(available).toHaveJSProperty('tagName', 'BUTTON')
  await expect(soon).toHaveAttribute('aria-disabled', 'true')
  await expect(soon).toHaveJSProperty('tagName', 'SPAN')
})

test('the phone mock-up is not clipped by its own notifications', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/mk')
  await page.waitForTimeout(400)

  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, 'no horizontal scroll at 390px').toBeLessThanOrEqual(0)

  const floating = await page.evaluate(() =>
    [...document.querySelectorAll('.float-chip')].map((el) => getComputedStyle(el).position))
  expect(floating.every((p) => p === 'static'), 'chips stop floating on a phone').toBe(true)
})
