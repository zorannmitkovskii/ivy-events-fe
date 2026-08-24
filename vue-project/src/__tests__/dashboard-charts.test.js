import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import RsvpDonut from '@/components/dashboard/RsvpDonut.vue'
import EventsByMonthChart from '@/components/dashboard/EventsByMonthChart.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import en from '@/i18n/locales/en.json'

/**
 * The chart and card components (IVY-1202).
 *
 * <p>jsdom has no 2D canvas, so what a chart *draws* cannot be asserted here.
 * What can — and what actually goes wrong — is everything around the drawing:
 * whether a component throws on empty data, whether identity survives without
 * colour, and whether a derived number is derived correctly.
 */

// chart.js needs a context; jsdom returns null and the library throws. Stubbed
// so the surrounding markup is testable — the drawing itself is not the subject.
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    canvas: { width: 300, height: 150 },
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), closePath: vi.fn(),
    fill: vi.fn(), stroke: vi.fn(), arc: vi.fn(), rect: vi.fn(),
    clearRect: vi.fn(), fillRect: vi.fn(), strokeRect: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })), fillText: vi.fn(),
    translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), setTransform: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    setLineDash: vi.fn(), getLineDash: vi.fn(() => []),
    moveTo: vi.fn(), lineTo: vi.fn(), bezierCurveTo: vi.fn(), quadraticCurveTo: vi.fn(),
    clip: vi.fn(), isPointInPath: vi.fn(() => false),
  }))
})

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const mountWith = (component, props) =>
  mount(component, { props, global: { plugins: [i18n] } })

describe('the RSVP donut', () => {
  it('derives declined from responded minus confirmed', () => {
    const wrapper = mountWith(RsvpDonut, {
      confirmed: 60, responded: 80, invited: 20, rate: 80
    })

    const values = wrapper.findAll('.legend .value').map((node) => node.text())
    expect(values).toEqual(['60', '20', '20'])
  })

  it('never derives a negative count from inconsistent inputs', () => {
    const wrapper = mountWith(RsvpDonut, {
      confirmed: 90, responded: 40, invited: 0, rate: 100
    })

    const values = wrapper.findAll('.legend .value').map((node) => node.text())
    expect(values[1]).toBe('0')
  })

  it('carries identity in the legend, not in colour alone', () => {
    const wrapper = mountWith(RsvpDonut, {
      confirmed: 1, responded: 1, invited: 1, rate: 50
    })
    const text = wrapper.text()

    expect(text).toContain('Confirmed')
    expect(text).toContain('Declined')
    expect(text).toContain('Awaiting reply')
  })

  it('says nothing was sent rather than drawing an empty ring', () => {
    const wrapper = mountWith(RsvpDonut, {
      confirmed: 0, responded: 0, invited: 0, rate: null
    })

    expect(wrapper.text()).toContain('No invitations sent yet')
    expect(wrapper.find('canvas').exists()).toBe(false)
  })

  it('shows an em dash for a rate nobody can compute yet', () => {
    const wrapper = mountWith(RsvpDonut, {
      confirmed: 1, responded: 1, invited: 0, rate: null
    })

    expect(wrapper.find('.centre').text()).toBe('—')
  })
})

describe('the monthly bar chart', () => {
  it('renders a canvas with a text alternative when there is data', () => {
    const wrapper = mountWith(EventsByMonthChart, {
      points: [{ month: '2026-08', count: 3 }, { month: '2026-09', count: 1 }]
    })

    expect(wrapper.find('canvas').attributes('aria-label')).toContain('2026-08: 3')
  })

  it('says so when every month is empty rather than drawing a flat line of zeroes', () => {
    const wrapper = mountWith(EventsByMonthChart, {
      points: [{ month: '2026-08', count: 0 }, { month: '2026-09', count: 0 }]
    })

    expect(wrapper.text()).toContain('No dated events in this period')
    expect(wrapper.find('canvas').exists()).toBe(false)
  })

  it('survives an empty payload', () => {
    expect(() => mountWith(EventsByMonthChart, { points: [] })).not.toThrow()
  })
})

describe('the stat card', () => {
  it('pairs a tone with a glyph so colour is never the only signal', () => {
    const wrapper = mountWith(StatCard, {
      label: 'Delayed tasks', value: 9, tone: 'critical'
    })

    expect(wrapper.find('.glyph').exists()).toBe(true)
    expect(wrapper.classes()).toContain('tone-critical')
  })

  it('carries no glyph when there is nothing to flag', () => {
    const wrapper = mountWith(StatCard, { label: 'Guests', value: 12 })
    expect(wrapper.find('.glyph').exists()).toBe(false)
  })

  it('is a plain article when it has nowhere to go', () => {
    const wrapper = mountWith(StatCard, { label: 'Guests', value: 12 })
    expect(wrapper.element.tagName).toBe('ARTICLE')
    expect(wrapper.classes()).not.toContain('linked')
  })
})
