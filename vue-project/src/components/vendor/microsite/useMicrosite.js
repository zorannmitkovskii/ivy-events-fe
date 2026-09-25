import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * What every microsite model reads, decided once.
 *
 * <p>The server already filled the content's gaps from the profile (headline,
 * services, gallery, FAQ). What is left here is the page's own wording: a
 * heading the vendor left empty is drawn in the reader's language from the
 * model's defaults, and pictures are looked up by portfolio id.
 */

/** Which design model draws which stored theme. The enum predates the designs. */
export const MODEL_OF_THEME = {
  CLASSIC: 'classic',
  GALLERY: 'gallery',
  STAGE: 'scene',
  EDITORIAL: 'textual',
}

export const THEMES = Object.keys(MODEL_OF_THEME)

/** The process a vendor who wrote none still gets: it is how every inquiry goes. */
const DEFAULT_STEP_KEYS = ['request', 'offer', 'agreement']

export function useMicrosite(props) {
  const { t, te } = useI18n()

  const model = computed(() => MODEL_OF_THEME[props.theme] ?? 'classic')
  const content = computed(() => props.content ?? {})
  const vendor = computed(() => props.vendor ?? {})

  const show = (section) => props.sections?.[section] !== false

  /**
   * The vendor's own words, else the model's default, else the shared one.
   *
   * @param value what the vendor wrote
   * @param key the default's key under `vendorMicrosite.<model>` / `.common`
   */
  function say(value, key, params = {}) {
    if (value) return value
    const own = `vendorMicrosite.${model.value}.${key}`
    return te(own) ? t(own, params) : t(`vendorMicrosite.common.${key}`, params)
  }

  const images = computed(() => (props.media ?? []).filter((item) => item.kind === 'IMAGE'))
  const links = computed(() => (props.media ?? []).filter((item) => item.kind !== 'IMAGE'))

  const byId = computed(() => new Map(images.value.map((item) => [item.id, item])))
  const imageUrl = (mediaId) => byId.value.get(mediaId)?.url ?? ''

  const hero = computed(() => content.value.hero ?? {})
  const heroImage = computed(() => imageUrl(hero.value.mediaId))

  /** Only while the vendor keeps the gallery switched on. */
  const gallery = computed(() => {
    if (!show('gallery')) return []
    return (content.value.gallery ?? [])
      .map((item) => ({ ...item, url: imageUrl(item.mediaId) }))
      .filter((item) => item.url)
  })

  const services = computed(() => (show('services') ? content.value.services ?? [] : []))
  const faq = computed(() => (show('faq') ? content.value.faq ?? [] : []))
  const eventTypes = computed(() => content.value.eventTypes ?? [])

  const chapters = computed(() =>
    (content.value.chapters ?? []).map((chapter) => ({ ...chapter, url: imageUrl(chapter.mediaId) })))

  const steps = computed(() => {
    const own = content.value.steps ?? []
    if (own.length) return own
    return DEFAULT_STEP_KEYS.map((key) => ({
      title: t(`vendorMicrosite.common.steps.${key}.title`),
      description: t(`vendorMicrosite.common.steps.${key}.description`),
    }))
  })

  const intro = (section) => content.value[section] ?? {}

  const place = computed(() => vendor.value.serviceArea || props.details?.serviceArea || vendor.value.city || '')
  const email = computed(() => props.details?.email || '')

  const tags = computed(() => vendor.value.tags ?? [])
  const relatedPosts = computed(() => vendor.value.relatedPosts ?? [])

  const number = (index) => String(index + 1).padStart(2, '0')

  const kind = computed(() => (vendor.value.type ? t(`vendorType.${vendor.value.type}`) : ''))
  const tagline = computed(() => props.details?.tagline || '')

  return {
    model, content, vendor, show, say,
    images, links, imageUrl, hero, heroImage, gallery, services, faq, eventTypes,
    chapters, steps, intro, place, email, tags, relatedPosts, number, kind, tagline,
  }
}

/** A design `.photo` is a background, so a missing picture keeps the block and its tint. */
export function photoStyle(url) {
  return url ? { backgroundImage: `url("${url}")` } : {}
}

/** What every model component takes; VendorMicrosite passes them straight through. */
export const MICROSITE_PROPS = {
  vendor: { type: Object, required: true },
  media: { type: Array, default: () => [] },
  /** The microsite's content, gaps already filled by the server. */
  content: { type: Object, default: () => ({}) },
  /** The profile's public extras: tagline, contact, service area. */
  details: { type: Object, default: () => ({}) },
  /** Which optional sections the vendor switched on. Missing keys count as on. */
  sections: { type: Object, default: () => ({}) },
  theme: { type: String, default: 'CLASSIC' },
  /** Enables the inquiry form. */
  slug: { type: String, default: '' },
  /** The vendor's own preview draws the form but never sends it. */
  formDisabled: { type: Boolean, default: false },
}
