import { test, expect } from '@playwright/test'

/**
 * INV-101 — the first choice of a new invitation: the type of event, and
 * "continue the draft" (only when there is one) or "start a new invitation".
 * The category filters the designs and decides the fields; the choice stays on
 * Back/Forward.
 */

const CARDS = [
  { category: 'WEDDING', order: 1, available: true, featured: true, tint: '', sample: { en: 'Elena & Nikola' }, types: ['WEDDING'] },
  { category: 'BIRTHDAY', order: 2, available: true, featured: false, tint: 'rose', sample: { en: 'Mia turns 8' }, types: ['BIRTHDAY_ADULT', 'BIRTHDAY_CHILD'] },
  { category: 'CORPORATE', order: 3, available: false, featured: false, tint: 'night', sample: { en: 'Annual gala' }, types: [] },
]

async function stubApi(page, { templates = {} } = {}) {
  const asked = []
  await page.route('**/v1/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) }))
  await page.route('**/v1/api/public/event-categories', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: null, data: CARDS }) }))
  await page.route('**/public/invitation-templates/category/**', (route) => {
    const category = decodeURIComponent(route.request().url().split('/').pop())
    asked.push(category)
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(templates[category] ?? []) })
  })
  return asked
}

async function asGuest(page, state = null) {
  await page.addInitScript((saved) => {
    localStorage.setItem('cookie_consent', 'rejected')
    localStorage.setItem('lang', 'en')
    if (saved && !sessionStorage.getItem('__seeded')) {
      localStorage.setItem('onboarding_state_v1', JSON.stringify(saved))
      sessionStorage.setItem('__seeded', '1')
    }
  }, state)
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } })

  test('a new guest: no "continue", a birthday gets its own designs and a title, kept on Back/Forward', async ({ page }) => {
    await asGuest(page)
    const asked = await stubApi(page, {
      templates: { BIRTHDAY: [{ id: 'b1', name: 'Confetti', path: 'invitations/coastal-breeze', active: true }] },
    })
    await page.goto('/en/event-category')

    await expect(page.getByTestId('start-choice')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Continue draft/ })).toHaveCount(0)
    // "Coming soon" is not a button.
    await expect(page.locator('#category-picker button.cat')).toHaveCount(2)

    await page.locator('#category-picker button.cat', { hasText: 'Birthdays' }).click()
    await page.getByRole('button', { name: "A child's" }).click()
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page).toHaveURL(/\/en\/event-basics/)
    await expect(page.getByLabel('Event title')).toBeVisible()
    await expect(page.getByLabel("Bride's Name")).toHaveCount(0)
    await page.getByLabel('Event title').fill('Mia turns 8')

    // Browser Back: the category page with the birthday still chosen.
    await page.goBack()
    await expect(page).toHaveURL(/\/en\/event-category/)
    await expect(page.getByTestId('start-choice')).toHaveCount(0)
    await expect(page.locator('#category-picker .cat.active')).toContainText('Birthdays')
    // Forward: what was typed is still there.
    await page.goForward()
    await expect(page.getByLabel('Event title')).toHaveValue('Mia turns 8')

    await page.getByLabel('Date', { exact: true }).fill('2099-06-12')
    await page.getByLabel('Start time').fill('17:30')
    await page.getByLabel('Venue', { exact: true }).fill('Play park')
    await page.getByTestId('event-basics-continue').click()

    await expect(page).toHaveURL(/\/en\/event-invitations/)
    await expect(page.getByTestId('designs-category')).toHaveText('Designs for: Birthdays & Parties')
    await expect(page.getByTestId('invitation-card')).toHaveCount(1)
    expect(asked).toEqual(['BIRTHDAY'])
  })

  test('with a draft: "continue" opens it where it was left, and Back does not ask again', async ({ page }) => {
    await asGuest(page, {
      selectedCategory: 'WEDDING',
      eventDetails: {
        brideName: 'Ана', groomName: 'Марко', title: '', date: '2099-06-12', time: '17:30',
        timezone: 'Europe/Skopje', location: { name: 'Охрид', address: '' },
      },
      invitationName: 't-coastal',
      invitationPath: 'invitations/coastal-breeze',
    })
    await stubApi(page, {
      templates: { WEDDING: [{ id: 't-coastal', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true }] },
    })
    await page.goto('/en/event-category')

    const choice = page.getByTestId('start-choice')
    await expect(choice).toBeVisible()
    await expect(choice).toContainText('Ана & Марко')
    await expect(choice).toContainText('Weddings')
    await expect(page.locator('#category-picker')).toHaveCount(0)

    await page.getByTestId('resume-draft').click()
    await expect(page).toHaveURL(/\/en\/invitations\/coastal-breeze\?.*new=1/)

    // Back to the first page in the same visit: the categories, not the question again.
    await page.goBack()
    await expect(page).toHaveURL(/\/en\/event-category/)
    await expect(page.getByTestId('start-choice')).toHaveCount(0)
    await expect(page.locator('#category-picker .cat.active')).toContainText('Weddings')
  })

  test('a design list that fails says so and retries; an empty one offers another type', async ({ page }) => {
    await asGuest(page, { selectedCategory: 'BIRTHDAY', selectedTypeCode: 'BIRTHDAY_ADULT' })
    await page.route('**/v1/api/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) }))
    let calls = 0
    await page.route('**/public/invitation-templates/category/**', (route) => {
      calls += 1
      return calls === 1
        ? route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
        : route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.goto('/en/event-invitations')

    await expect(page.getByTestId('designs-error')).toBeVisible()
    await page.getByTestId('designs-error').getByRole('button', { name: 'Try again' }).click()
    const empty = page.getByTestId('designs-empty')
    await expect(empty).toContainText('There are no designs for “Birthdays & Parties” yet.')
    await empty.getByRole('link', { name: 'Choose another type' }).click()
    await expect(page).toHaveURL(/\/en\/event-category/)
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the start choice fits a phone and works with the keyboard', async ({ page }) => {
    await asGuest(page, {
      selectedCategory: 'WEDDING',
      eventDetails: { brideName: 'Ана', groomName: '', title: '', date: '', time: '', timezone: 'Europe/Skopje', location: { name: '', address: '' } },
    })
    await stubApi(page)
    await page.goto('/en/event-category')

    await expect(page.getByTestId('start-choice')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)

    await page.getByTestId('start-new').focus()
    await page.keyboard.press('Enter')
    // INV-302: the draft on this device would be replaced — asked first.
    await expect(page.getByTestId('discard-cancel')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('discard-confirm')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#category-picker')).toBeVisible()
    await expect(page.locator('#category-picker button.cat').first()).toBeFocused()
  })
})
