import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-703 — from the publication screen to the RSVP replies.
 *
 * The success screen says where replies appear and links to the existing
 * guest list (dashboard "Guests") of exactly the published event; the link
 * selects that event only if it is one of the person's own events. The guest
 * list explains the state before the first reply instead of looking empty or
 * broken, and says who can see guest data.
 */

const getAll = vi.fn()
const listGuests = vi.fn()
const getTables = vi.fn()

vi.mock('@/services/events.service', () => ({
  eventsService: { getAll: (...a) => getAll(...a) },
}))
vi.mock('@/services/guests.service', () => ({
  guestsService: { list: (...a) => listGuests(...a) },
}))
vi.mock('@/services/tables.service', () => ({
  tablesService: { getTables: (...a) => getTables(...a) },
}))

const {
  linkedEventId, selectEventFromLink, refuseEventLink, settleEventLinkNotice,
  dismissEventLinkNotice, eventLinkNotice,
} = await import('@/services/eventSelection.service')
const { onboardingStore, clearOnboarding, setEventId, setSelectedCategory } = await import('@/store/onboarding.store')
const RsvpNextStep = (await import('@/components/payment/RsvpNextStep.vue')).default
const GuestsPage = (await import('@/pages/dashboard/GuestsPage.vue')).default

const EVENT = '7b0c9d2e-1f3a-4b5c-8d6e-9f0a1b2c3d4e'
const OTHER = '11111111-2222-4333-8444-555555555555'

const makeI18n = (locale = 'en') => createI18n({ legacy: false, locale, messages: { en, mk, sq } })
function makeRouter() {
  const Stub = { template: '<div />' }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/:lang/x', name: 'here', component: Stub },
      { path: '/:lang/dashboard/events/guests', name: 'dashboard.guests', component: Stub },
      { path: '/:lang/dashboard/events/invitation-links', name: 'dashboard.invitation-links', component: Stub },
    ],
  })
}
const $ = (w, id) => w.find(`[data-testid="${id}"]`)

beforeEach(() => {
  vi.clearAllMocks()
  clearOnboarding()
  dismissEventLinkNotice()
})

describe('linkedEventId', () => {
  it('accepts one event id and nothing else', () => {
    expect(linkedEventId({ query: { eventId: EVENT } })).toBe(EVENT)
    expect(linkedEventId({ query: { eventId: [EVENT, OTHER] } })).toBe(EVENT)
    for (const bad of ['', 'abc', '../admin', `${EVENT}x`, 'javascript:alert(1)', undefined, null, 42]) {
      expect(linkedEventId({ query: { eventId: bad } })).toBe('')
    }
    expect(linkedEventId({})).toBe('')
  })
})

describe('selectEventFromLink', () => {
  it('selects the linked event — id, category and status — when it is one of the person\'s events', async () => {
    setEventId(OTHER)
    setSelectedCategory('BIRTHDAY')
    getAll.mockResolvedValue({ data: [
      { id: OTHER, categoryType: 'BIRTHDAY', status: 'DRAFT' },
      { id: EVENT, categoryType: 'WEDDING', status: 'ACTIVE' },
    ] })
    await expect(selectEventFromLink(EVENT)).resolves.toBe('selected')
    expect(onboardingStore.eventId).toBe(EVENT)
    expect(onboardingStore.selectedCategory).toBe('WEDDING')
    expect(onboardingStore.eventStatus).toBe('ACTIVE')
    expect(eventLinkNotice.value).toBe('')
  })

  it('refuses an event that is not in the person\'s list and leaves the current selection alone', async () => {
    setEventId(OTHER)
    getAll.mockResolvedValue([{ id: OTHER }])
    await expect(selectEventFromLink(EVENT)).resolves.toBe('refused')
    expect(onboardingStore.eventId).toBe(OTHER)
    expect(eventLinkNotice.value).toBe('refused')
  })

  it('when the list cannot be loaded, the linked id is used (the server still checks access)', async () => {
    setEventId(OTHER)
    getAll.mockRejectedValue(new Error('offline'))
    await expect(selectEventFromLink(EVENT)).resolves.toBe('unverified')
    expect(onboardingStore.eventId).toBe(EVENT)
    expect(eventLinkNotice.value).toBe('')
  })

  it('the refusal notice survives the redirect that drops ?eventId= and goes away on the next navigation', () => {
    refuseEventLink()
    settleEventLinkNotice() // the redirect itself
    expect(eventLinkNotice.value).toBe('refused')
    settleEventLinkNotice() // the next page
    expect(eventLinkNotice.value).toBe('')
  })
})

describe('RsvpNextStep (success screen, #next slot)', () => {
  async function mountStep(eventId, locale = 'en') {
    const router = makeRouter()
    await router.push({ name: 'here', params: { lang: locale } })
    await router.isReady()
    return mount(RsvpNextStep, { props: { eventId }, global: { plugins: [router, makeI18n(locale)] } })
  }

  it('says where replies appear, that an empty list is normal, who can see them — and links to this event\'s guest list', async () => {
    const w = await mountStep(EVENT)
    const section = $(w, 'rsvp-next')
    expect(section.attributes('aria-labelledby')).toBe('rsvp-next-title')
    expect(w.find('h2#rsvp-next-title').text()).toBe("Where you will see your guests' replies")
    expect(section.text()).toContain('Dashboard → Guests')
    expect(section.text()).toContain('not an error')
    expect($(w, 'rsvp-who').text()).toContain('Guests never see the list')
    const link = $(w, 'open-guest-list')
    expect(link.text()).toBe('Open the guest list')
    expect(link.attributes('href')).toBe(`/en/dashboard/events/guests?eventId=${EVENT}`)
  })

  it('renders nothing without a valid event id (no link to some other event)', async () => {
    for (const id of ['', 'not-an-id']) {
      const w = await mountStep(id)
      expect($(w, 'rsvp-next').exists()).toBe(false)
    }
  })

  it('renders in Macedonian and Albanian', async () => {
    expect($(await mountStep(EVENT, 'mk'), 'open-guest-list').text()).toBe('Отвори ја листата на гости')
    expect($(await mountStep(EVENT, 'sq'), 'open-guest-list').text()).toBe('Hap listën e mysafirëve')
  })
})

describe('GuestsPage before and after the first reply', () => {
  async function mountGuests(locale = 'en') {
    const router = makeRouter()
    await router.push({ name: 'dashboard.guests', params: { lang: locale } })
    await router.isReady()
    const w = mount(GuestsPage, {
      global: {
        plugins: [router, makeI18n(locale)],
        stubs: { GuestsToolbar: true, GuestsTable: { props: ['rows'], template: '<div data-testid="guests-table">{{ rows.length }}</div>' }, AddGuestModal: true, PageHeader: true },
      },
    })
    await flushPromises()
    return w
  }

  beforeEach(() => {
    setEventId(EVENT)
    getTables.mockResolvedValue([])
  })

  it('no guests yet: an informative empty state (not an error), the guest list of the selected event, who can see it', async () => {
    listGuests.mockResolvedValue([])
    const w = await mountGuests()
    expect(listGuests).toHaveBeenCalledWith(EVENT, 'all')
    const empty = $(w, 'guests-empty')
    expect(empty.exists()).toBe(true)
    expect(empty.find('h2').text()).toBe('No RSVP replies yet')
    expect(empty.text()).toContain('Confirmed')
    expect(empty.find('[role="alert"]').exists()).toBe(false)
    expect(w.text()).not.toContain('Could not load guests')
    expect($(w, 'guests-empty-share').attributes('href')).toBe('/en/dashboard/events/invitation-links')
    expect($(w, 'guests-who').text()).toContain('Guests never see the list')
    expect($(w, 'guests-table').exists()).toBe(false)
  })

  it('guests added by hand but no replies yet: the list plus a short note', async () => {
    listGuests.mockResolvedValue([{ id: 'g1', name: 'Ana', inviteStatus: 'PENDING' }])
    const w = await mountGuests()
    expect($(w, 'guests-empty').exists()).toBe(false)
    expect($(w, 'guests-table').text()).toBe('1')
    expect($(w, 'guests-no-replies').text()).toContain('Nobody has replied')
  })

  it('once someone has replied, no "no replies" note', async () => {
    listGuests.mockResolvedValue([
      { id: 'g1', name: 'Ana', inviteStatus: 'PENDING' },
      { id: 'g2', name: 'Marko', inviteStatus: 'CONFIRMED' },
    ])
    const w = await mountGuests()
    expect($(w, 'guests-no-replies').exists()).toBe(false)
    expect($(w, 'guests-table').text()).toBe('2')
  })

  it('a failed load is still an error with a retry, never the empty state', async () => {
    listGuests.mockRejectedValue(new Error('boom'))
    const w = await mountGuests()
    expect(w.text()).toContain('Could not load guests')
    expect($(w, 'guests-empty').exists()).toBe(false)
  })

  it('renders the empty state in Macedonian', async () => {
    listGuests.mockResolvedValue([])
    const w = await mountGuests('mk')
    expect($(w, 'guests-empty').find('h2').text()).toBe('Сè уште нема RSVP одговори')
  })
})

describe('i18n', () => {
  it('the new texts exist in mk, en and sq and none is empty', () => {
    const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
      typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`])
    for (const pick of [(l) => l.cpay.publish.rsvp, (l) => l.guests.rsvpEmpty, (l) => l.dash.eventLink]) {
      const enKeys = keys(pick(en)).sort()
      expect(enKeys.length).toBeGreaterThan(1)
      for (const locale of [mk, sq]) expect(keys(pick(locale)).sort()).toEqual(enKeys)
      for (const locale of [en, mk, sq]) {
        for (const k of enKeys) {
          const v = k.split('.').reduce((o, part) => o[part], pick(locale))
          expect(typeof v === 'string' && v.trim().length > 0).toBe(true)
          expect(v).not.toMatch(/[|@{}]/)
        }
      }
    }
  })
})
