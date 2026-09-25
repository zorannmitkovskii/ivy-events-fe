import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import EventsTable from '@/components/dashboard/EventsTable.vue'
import en from '@/i18n/locales/en.json'

/**
 * The agency's events as a table (IVY-1402).
 *
 * <p>What a table promises over a set of cards is that the rows are comparable:
 * the same fact in the same place on every line, in an order the reader picked.
 * These tests hold that promise — the sort, the empty denominators, and the
 * column that must disappear rather than print a dash for everyone.
 */

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

/** The page's own helpers, copied verbatim — the table is handed these. */
const invitedCount = (ev) => {
  const m = ev.metrics
  if (!m) return 0
  return (m.confirmedCount || 0) + (m.declinedCount || 0) + (m.awaitingCount || 0)
}

const rsvpPercent = (ev, key) => {
  const asked = invitedCount(ev)
  return asked ? Math.round(((ev.metrics[key] || 0) / asked) * 100) : 0
}

const isDone = (ev) => String(ev.status || '').toUpperCase() === 'COMPLETED'

const event = (over = {}) => ({
  id: over.id || 'e1',
  name: 'Ана & Марко',
  date: '2026-11-20',
  location: { city: 'Скопје' },
  createdBy: 'u-1',
  metrics: { guestCount: 100, confirmedCount: 50, declinedCount: 10, awaitingCount: 40, overdueTaskCount: 0 },
  ...over,
})

const render = (props = {}) =>
  mount(EventsTable, {
    props: {
      events: [event()],
      isDone,
      rsvpPercent,
      invitedCount,
      ...props,
    },
    global: { plugins: [i18n] },
  })

const headers = (wrapper) => wrapper.findAll('th').map((th) => th.text().replace(/[▲▼]/g, '').trim())
const cells = (wrapper) => wrapper.findAll('tbody tr').map((tr) => tr.findAll('td').map((td) => td.text()))

describe('the agency events table', () => {
  it('puts every column the agency asked for on each row', () => {
    const wrapper = render({ organizerNames: { 'u-1': 'Марија Стојанова' } })

    expect(headers(wrapper)).toEqual(['Event', 'Date', 'Location', 'Guests', 'RSVP', 'Overdue', 'Organizer'])

    const [row] = cells(wrapper)
    expect(row[0]).toContain('Ана & Марко')
    expect(row[2]).toBe('Скопје')
    expect(row[3]).toBe('100')
    expect(row[4]).toContain('50%')
    expect(row[6]).toBe('Марија Стојанова')
  })

  it('drops the organizer column when no names came back, rather than printing a dash per row', () => {
    // The team endpoint is ORG_ADMIN-only. An organizer opening their own
    // workspace gets a 403, and a column that is empty for everybody is worse
    // than one that is not there.
    expect(headers(render())).not.toContain('Organizer')
    expect(cells(render())[0]).toHaveLength(6)
  })

  it('sorts by date on arrival, so the soonest wedding is the top row', () => {
    const wrapper = render({
      events: [
        event({ id: 'late', name: 'Late', date: '2027-01-01' }),
        event({ id: 'soon', name: 'Soon', date: '2026-10-01' }),
      ],
    })

    expect(cells(wrapper).map((row) => row[0])).toEqual(['Soon', 'Late'])
  })

  it('reverses the same column on a second click, and does not reverse a different one', async () => {
    const wrapper = render({
      events: [
        event({ id: 'late', name: 'Late', date: '2027-01-01' }),
        event({ id: 'soon', name: 'Soon', date: '2026-10-01' }),
      ],
    })
    const dateHeader = wrapper.findAll('th')[1]

    await dateHeader.find('button').trigger('click')
    expect(cells(wrapper).map((row) => row[0])).toEqual(['Late', 'Soon'])

    // Switching columns starts ascending again instead of inheriting the
    // previous column's direction, which would silently invert the new one.
    await wrapper.findAll('th')[0].find('button').trigger('click')
    expect(wrapper.findAll('th')[0].attributes('aria-sort')).toBe('ascending')
  })

  it('keeps an undated event last whichever way the date column points', async () => {
    const wrapper = render({
      events: [
        event({ id: 'none', name: 'Undated', date: null }),
        event({ id: 'dated', name: 'Dated', date: '2026-10-01' }),
      ],
    })

    expect(cells(wrapper).map((row) => row[0])).toEqual(['Dated', 'Undated'])

    await wrapper.findAll('th')[1].find('button').trigger('click')
    expect(cells(wrapper).map((row) => row[0])).toEqual(['Dated', 'Undated'])
  })

  it('leaves RSVP blank when nobody has been invited, rather than reporting 0%', () => {
    // Zero percent is a real answer about a real denominator. An event with no
    // invitations sent has no denominator at all, and the two must not look
    // the same in a column people scan for trouble.
    const wrapper = render({
      events: [event({ metrics: { guestCount: 80, confirmedCount: 0, declinedCount: 0, awaitingCount: 0 } })],
    })

    expect(cells(wrapper)[0][4]).toBe('—')
  })

  it('marks the rows the card view would have called urgent', () => {
    const wrapper = render({
      events: [event({ id: 'a' }), event({ id: 'b', name: 'Calm' })],
      urgentIds: new Set(['a']),
    })
    const rows = wrapper.findAll('tbody tr')

    expect(rows[0].classes()).toContain('urgent')
    expect(rows[1].classes()).not.toContain('urgent')
  })

  it('opens the event that was clicked', async () => {
    const wrapper = render({ events: [event({ id: 'e9' })] })

    await wrapper.find('tbody tr').trigger('click')

    expect(wrapper.emitted('open')[0][0].id).toBe('e9')
  })

  it('says so when the search hid everything, instead of showing a bare header', () => {
    const wrapper = render({ events: [] })

    expect(wrapper.find('.empty-cell').text()).toBe(en.organizerOverview.noneMatch)
  })
})
