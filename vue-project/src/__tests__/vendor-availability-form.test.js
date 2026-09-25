import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'

/**
 * Marking days off in the supplier's calendar (IVY-801).
 *
 * <p>Three things were wrong with the row and each is asserted below. The
 * status list offered "Available", which wrote a row that said nothing — a day
 * is free by having no block, and a day already blocked is freed by releasing
 * it. A holiday is a week rather than a day, and the endpoint had taken a
 * range all along while the form could only send one date. And the select
 * carried no style rule at all, so it stood shorter than everything beside it;
 * that one is CSS, asserted here only as the class the rule hangs on.
 */

const sent = vi.hoisted(() => ({ calls: [] }))

vi.mock('@/services/vendorPortal.service', () => ({
  vendorPortalService: {
    listBookings: () => Promise.resolve([]),
    updateBooking: vi.fn(),
    guestSummary: vi.fn(),
    createBooking: vi.fn(),
  },
  vendorAvailabilityService: {
    calendar: () => Promise.resolve({ data: { blocks: [] } }),
    block: (payload) => {
      sent.calls.push(payload)
      return Promise.resolve()
    },
    confirmHold: vi.fn(),
    release: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('@/components/ui/PageHeader.vue', () => ({
  default: { props: ['title', 'subtitle'], template: '<header />' },
}))

// Stubbed to a button that picks a known day, so the panel under test opens
// without dragging a whole month grid into this file.
vi.mock('@/components/vendor/MonthCalendar.vue', () => ({
  default: {
    props: ['bookings', 'selectedKey'],
    emits: ['select', 'range-change'],
    // Two arguments, as the real one emits: the day, and that day's bookings.
    template: '<button class="pick" @click="$emit(\'select\', new Date(2026, 9, 18), [])" />',
  },
}))

const VendorCalendarPage = (
  await import('@/pages/vendorDashboard/VendorCalendarPage.vue')
).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

async function openDay() {
  const wrapper = mount(VendorCalendarPage, { global: { plugins: [i18n] } })
  await wrapper.find('.pick').trigger('click')
  await wrapper.vm.$nextTick()
  return wrapper
}

beforeEach(() => {
  sent.calls = []
})

describe('the status list', () => {
  it('offers only the two states a vendor can actually set', async () => {
    const wrapper = await openDay()
    const values = wrapper.findAll('.block-form select option').map((o) => o.attributes('value'))

    expect(values).toEqual(['UNAVAILABLE', 'HOLD'])
  })

  it('no longer offers "available", which wrote a row meaning nothing', async () => {
    const wrapper = await openDay()
    const values = wrapper.findAll('.block-form select option').map((o) => o.attributes('value'))

    // Matched exactly, not by substring: UNAVAILABLE contains AVAILABLE.
    expect(values).not.toContain('AVAILABLE')
    expect(values).toContain('UNAVAILABLE')
  })

  it('shares one sizing class with every other control in the row', async () => {
    // The select had no rule and stood ~20px shorter than the inputs beside
    // it. The class is what the 44px min-height now hangs on.
    const wrapper = await openDay()

    expect(wrapper.find('.block-form select').classes()).toContain('field')
    expect(wrapper.find('.block-form input[type="date"]').classes()).toContain('field')
  })
})

describe('how long the block runs', () => {
  it('sends a single date when no end day is given', async () => {
    const wrapper = await openDay()
    await wrapper.find('.block-form').trigger('submit')

    expect(sent.calls).toHaveLength(1)
    expect(sent.calls[0]).toMatchObject({ date: '2026-10-18', status: 'UNAVAILABLE' })
    expect(sent.calls[0].from).toBeUndefined()
  })

  it('sends a range when the vendor is away for a stretch', async () => {
    const wrapper = await openDay()
    await wrapper.find('.block-form input[type="date"]').setValue('2026-10-25')
    await wrapper.find('.block-form').trigger('submit')

    expect(sent.calls[0]).toMatchObject({ from: '2026-10-18', to: '2026-10-25' })
    expect(sent.calls[0].date).toBeUndefined()
  })

  it('treats an end day equal to the start as the single day it is', async () => {
    const wrapper = await openDay()
    await wrapper.find('.block-form input[type="date"]').setValue('2026-10-18')
    await wrapper.find('.block-form').trigger('submit')

    expect(sent.calls[0]).toMatchObject({ date: '2026-10-18' })
    expect(sent.calls[0].from).toBeUndefined()
  })

  it('clears the end day after saving, so the next block is not silently a week', async () => {
    const wrapper = await openDay()
    await wrapper.find('.block-form input[type="date"]').setValue('2026-10-25')
    await wrapper.find('.block-form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.block-form input[type="date"]').element.value).toBe('')
  })
})
