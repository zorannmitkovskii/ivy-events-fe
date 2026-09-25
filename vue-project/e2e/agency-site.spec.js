import { test, expect } from '@playwright/test'

/**
 * An agency's public site as a visitor sees it
 * (design/Ivy_Events_Agency_Microsite_Designs.html).
 *
 * <p>The API is stubbed with one site; each layout must draw its own
 * signature section, none may scroll sideways on a phone, and the request
 * form must send what the visitor typed.
 */

const SITE = (model) => ({
  slug: 'ivena',
  name: 'Ivena Agency',
  model,
  city: 'Skopje',
  email: 'hello@ivena.mk',
  imageUrls: {},
  tags: [{ slug: 'konferencii', name: 'Conferences' }],
  content: {
    hero: { eyebrow: 'Event planning', title: 'Events with', titleAccent: 'a clear plan.', text: 'From the first call.', ctaLabel: 'Talk to us', caption: 'Idea · Plan' },
    keywords: ['Private events', 'Corporate meetings', 'Conferences'],
    services: { eyebrow: 'Services', title: 'From concept to the last detail.' },
    serviceItems: [
      { label: '01 / Plan', name: 'Concept', description: 'Goal, budget, schedule.' },
      { label: '02 / People', name: 'Vendors and team', description: 'Partners chosen for the event.' },
    ],
    projects: { eyebrow: 'Realised', title: 'Different formats, the same care.' },
    statement: { eyebrow: 'Approach', title: 'The plan makes room for the event.' },
    chapters: [{ eyebrow: 'Chapter 01', title: 'We start with the goal.', text: 'Guests, context, flow.' }],
    process: { title: 'Three clear steps.' },
    steps: [{ title: 'Talk', description: 'What you plan.' }, { title: 'Proposal', description: 'Scope.' }, { title: 'Plan', description: 'People.' }],
    formats: { title: 'Events with different needs.' },
    formatItems: [{ title: 'Conferences', description: 'Agenda.' }, { title: 'Team days', description: 'Flow.' }],
    contact: { eyebrow: 'New request', title: 'Tell us what you plan.' },
  },
  projects: [
    { id: 'p1', title: 'Annual conference', city: 'Skopje', eventType: 'Conference', published: true, media: [] },
    { id: 'p2', title: 'Summer party', city: 'Ohrid', eventType: 'Corporate', published: true, media: [] },
  ],
})

async function stubSite(page, model, sent = []) {
  await page.route('**/v1/api/**', (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/v1/api', '')
    if (path === '/public/agencies/ivena/inquiries' && request.method() === 'POST') {
      sent.push(request.postDataJSON())
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { received: true } }) })
    }
    const data = path === '/public/agencies/ivena' ? SITE(model) : null
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: null, data }) })
  })
}

const SIGNATURE = {
  CLASSIC: '.am-service-grid',
  PORTFOLIO: '.am-tiles',
  EDITORIAL: '.am-chapter',
  CORPORATE: '.am-format-grid',
}

for (const [model, signature] of Object.entries(SIGNATURE)) {
  test(`the ${model} layout draws its own sections and the request form`, async ({ page }) => {
    await stubSite(page, model)
    await page.goto('/en/a/ivena')

    await expect(page.locator(signature).first()).toBeVisible()
    await expect(page.locator('#am-contact form')).toBeVisible()
  })

  test(`the ${model} layout does not scroll sideways on a phone`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await stubSite(page, model)
    await page.goto('/en/a/ivena')
    await expect(page.locator('.agency-site')).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('a visitor sends a request, and the agency receives what they typed', async ({ page }) => {
  const sent = []
  await stubSite(page, 'CLASSIC', sent)
  await page.goto('/en/a/ivena')

  const form = page.locator('#am-contact form')
  await form.locator('input[name="name"]').fill('Ana Petrova')
  await form.locator('input[name="email"]').fill('ana@example.com')
  await form.locator('select[name="type"]').selectOption('Conference')
  await form.locator('input[name="date"]').fill('12 October')
  await form.locator('input[name="city"]').fill('Skopje')
  await form.locator('textarea[name="message"]').fill('Annual partner conference.')
  await form.locator('input[name="consent"]').check()
  await form.locator('button[type="submit"]').click()

  await expect(page.locator('.am-form-success')).toBeVisible()
  expect(sent).toHaveLength(1)
  expect(sent[0]).toMatchObject({ name: 'Ana Petrova', type: 'Conference', date: '12 October', consent: true, website: '' })
})

test('a tag leads to its topic page', async ({ page }) => {
  await stubSite(page, 'CLASSIC')
  await page.goto('/en/a/ivena')

  await expect(page.locator('.am-tags a')).toHaveAttribute('href', '/en/tags/konferencii')
})
