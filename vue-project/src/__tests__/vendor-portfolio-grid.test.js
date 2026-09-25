import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en.json'

/**
 * The supplier's portfolio, as a grid (IVY-702).
 *
 * <p>Two things are asserted here, and the first is the reason the second was
 * ever worth writing. The vendor-portal endpoints answer with a bare list
 * while the rest of the API wraps everything in `ApiResponse`; the page used
 * to destructure `{ data }` off that list, which is `undefined`, and then
 * `!items.length` threw on every render. A grid that cannot show a picture is
 * not a grid, so the shape comes first.
 */

const media = vi.hoisted(() => ({ rows: [] }))

// A real ref, not a lookalike: the template reads `profile.instagramUrl` and
// relies on Vue unwrapping it. A plain `{ value }` passes the computed, which
// dereferences by hand, and silently fails the template — which is precisely
// the difference this file exists to catch.
const held = vi.hoisted(() => ({ profile: null }))

vi.mock('@/services/vendorPortal.service', () => ({
  vendorPortalService: {
    // Bare array — exactly what the server sends, no envelope.
    listMedia: () => Promise.resolve(media.rows),
    uploadMedia: vi.fn(),
    addMediaLink: vi.fn(),
    deleteMedia: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('@/composables/useVendorProfile', async () => {
  const { ref } = await import('vue')
  held.profile = ref(null)
  return {
    useVendorProfile: () => ({ profile: held.profile, load: () => Promise.resolve() }),
  }
})

vi.mock('@/components/ui/PageHeader.vue', () => ({
  default: { props: ['title', 'subtitle'], template: '<header />' },
}))

const VendorPortfolioPage = (
  await import('@/pages/vendorDashboard/VendorPortfolioPage.vue')
).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function render() {
  return mount(VendorPortfolioPage, { global: { plugins: [i18n] } })
}

/** onMounted awaits two promises before the grid exists. */
async function settle(wrapper) {
  await Promise.resolve()
  await Promise.resolve()
  await wrapper.vm.$nextTick()
}

beforeEach(() => {
  media.rows = []
  held.profile.value = { capabilities: ["GALLERY"], instagramUrl: null }
})

describe('the grid survives the shape the server actually sends', () => {
  it('renders a tile per item when the list arrives unwrapped', async () => {
    media.rows = [
      { id: '1', kind: 'IMAGE', url: '/a.jpg', title: 'Ceremony' },
      { id: '2', kind: 'IMAGE', url: '/b.jpg', title: 'First dance' },
      { id: '3', kind: 'VIDEO', url: 'https://youtu.be/x', title: 'Showreel' },
    ]

    const wrapper = render()
    await settle(wrapper)

    expect(wrapper.findAll('.grid .cell')).toHaveLength(3)
  })

  it('shows the empty state rather than throwing on an empty list', async () => {
    const wrapper = render()
    await settle(wrapper)

    expect(wrapper.find('.empty').exists()).toBe(true)
    expect(wrapper.find('.grid').exists()).toBe(false)
  })
})

describe('the Instagram handle', () => {
  it('reads the handle off the profile URL the vendor already gave', async () => {
    held.profile.value = {
      capabilities: ['GALLERY'],
      instagramUrl: 'https://www.instagram.com/studio.lumiere/?hl=mk',
    }

    const wrapper = render()
    await settle(wrapper)

    expect(wrapper.find('.ig-handle').text()).toBe('@studio.lumiere')
    expect(wrapper.find('.ig-link').attributes('href'))
      .toBe('https://www.instagram.com/studio.lumiere/?hl=mk')
  })

  it('offers nothing at all when the vendor has given no profile', async () => {
    const wrapper = render()
    await settle(wrapper)

    expect(wrapper.find('.ig-link').exists()).toBe(false)
  })
})

describe('the lightbox', () => {
  it('opens on the tile that was clicked and walks the grid from there', async () => {
    media.rows = [
      { id: '1', kind: 'IMAGE', url: '/a.jpg', title: 'One' },
      { id: '2', kind: 'IMAGE', url: '/b.jpg', title: 'Two' },
    ]

    const wrapper = render()
    await settle(wrapper)

    await wrapper.findAll('.cell-open')[1].trigger('click')
    expect(wrapper.find('.lb-figure img').attributes('src')).toBe('/b.jpg')

    // Wrapping is the point: a grid has no last tile once you are inside it.
    await wrapper.find('.lb-nav.next').trigger('click')
    expect(wrapper.find('.lb-figure img').attributes('src')).toBe('/a.jpg')
  })
})
