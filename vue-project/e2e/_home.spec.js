import { test } from '@playwright/test'
const OUT = 'C:/Users/techl/AppData/Local/Temp/claude/C--Projects-ZM/55310cf4-a555-4cd2-9a0a-3fb503da06a6/scratchpad/shots'

test('home desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/mk')
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}/home-1440-fold.png` })
  await page.screenshot({ path: `${OUT}/home-1440-full.png`, fullPage: true })

  const probe = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.innerText,
    navLinkTexts: [...document.querySelectorAll('header a, nav a')].map((a) => a.textContent.trim()).filter(Boolean),
    navCount: document.querySelectorAll('header nav').length,
    soon: [...document.querySelectorAll('*')].filter((el) => el.children.length === 0 && /наскоро/i.test(el.textContent)).length,
  }))
  console.log('HOME ' + JSON.stringify(probe))
})

test('home mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/mk')
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}/home-390-fold.png` })
})
