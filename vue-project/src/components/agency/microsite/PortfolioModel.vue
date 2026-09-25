<template>
  <div class="am-nav">
    <a class="am-logo" href="#am-top" @click.prevent="jumpTo('am-top')">{{ upperName }}</a>
    <nav :aria-label="t('agencySite.nav.label')">
      <a v-if="projects.length" href="#am-work" @click.prevent="jumpTo('am-work')">{{ t('agencySite.nav.projects') }}</a>
      <a v-if="serviceItems.length" href="#am-services" @click.prevent="jumpTo('am-services')">{{ t('agencySite.nav.whatWeDo') }}</a>
      <a class="am-nav-cta" href="#am-contact" @click.prevent="jumpTo('am-contact')">{{ t('agencySite.nav.newRequest') }} ↗</a>
    </nav>
  </div>

  <section id="am-top" class="am-hero">
    <AmPhoto :url="heroPhoto" :tint="1" :label="site.name" />
    <div class="am-hero-copy">
      <span v-if="hero.eyebrow" class="am-eyebrow" style="color:#e5d2ad">{{ hero.eyebrow }}</span>
      <h1>{{ [hero.title, hero.titleAccent].filter(Boolean).join(' ') }}</h1>
      <p v-if="hero.text">{{ hero.text }}</p>
      <a class="am-button" :href="`#${firstTarget}`" @click.prevent="jumpTo(firstTarget)">
        {{ projects.length ? t('agencySite.nav.viewProjects') : (hero.ctaLabel || t('agencySite.nav.talk')) }} ↓
      </a>
    </div>
  </section>

  <div class="am-filmstrip">
    <span v-for="(word, i) in filmstrip" :key="i">{{ word }}</span>
  </div>

  <section v-if="projects.length" id="am-work" class="am-work">
    <span v-if="content.projects?.eyebrow" class="am-eyebrow" style="color:#c6a46c">{{ content.projects.eyebrow }}</span>
    <h2>{{ content.projects?.title }}</h2>
    <div class="am-tiles">
      <AmPhoto v-for="(tile, i) in tiles" :key="i" :url="tile.url" :tint="i" :label="tile.title">
        <span>{{ tile.title }} / {{ pad(i) }}</span>
      </AmPhoto>
    </div>
    <p v-if="content.projects?.text" style="font-size:11px;color:#afbcae;margin-top:20px">{{ content.projects.text }}</p>
  </section>

  <section v-if="serviceItems.length" id="am-services" class="am-work" :style="projects.length ? 'padding-top:0' : null">
    <span v-if="content.services?.eyebrow" class="am-eyebrow" style="color:#c6a46c">{{ content.services.eyebrow }}</span>
    <h2>{{ content.services?.title }}</h2>
    <div v-for="(service, i) in serviceItems" :key="i" class="am-service-row">
      <strong>{{ service.name }}</strong>
      <p>{{ service.description }}</p>
    </div>
  </section>

  <section id="am-contact" class="am-contact">
    <div class="am-inner am-contact-grid">
      <div>
        <span v-if="content.contact?.eyebrow" class="am-eyebrow">{{ content.contact.eyebrow }}</span>
        <h2>{{ content.contact?.title || t('agencySite.contact.fallbackTitle') }}</h2>
        <p v-if="content.contact?.text">{{ content.contact.text }}</p>
      </div>
      <AgencyInquiryForm :slug="site.slug" :preview="preview" />
    </div>
  </section>
</template>

<script setup>
/** 02 · Portfolio: dark and photo-led; services and the form stay within reach. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AmPhoto from './AmPhoto.vue'
import AgencyInquiryForm from './AgencyInquiryForm.vue'
import { firstPhoto, imageOf, jumpTo, pad } from './siteView'

const props = defineProps({
  site: { type: Object, required: true },
  preview: { type: Boolean, default: false },
})

/** The mosaic's four cells: one tall, two small, one wide. */
const TILE_COUNT = 4

const { t } = useI18n()

const content = computed(() => props.site.content)
const hero = computed(() => content.value.hero || {})
const serviceItems = computed(() => content.value.serviceItems || [])
const projects = computed(() => props.site.projects || [])
const upperName = computed(() => String(props.site.name || '').toLocaleUpperCase())
const heroPhoto = computed(() => imageOf(props.site, hero.value.imageKey) || firstPhoto(projects.value[0]))
const firstTarget = computed(() => (projects.value.length ? 'am-work' : 'am-contact'))

/** The agency's own words if it wrote them, else who, what and where. */
const filmstrip = computed(() => {
  const words = content.value.keywords || []
  return words.length ? words : [upperName.value, hero.value.eyebrow, props.site.city].filter(Boolean)
})

/**
 * Every photo of every published project, in order, until the mosaic is
 * full — a project with three good photos can fill it alone.
 */
const tiles = computed(() => {
  const photos = projects.value.flatMap((project) =>
    (project.media?.length ? project.media : [{ url: null }]).map((media) => ({
      url: media.url,
      title: media.caption || project.title,
    })))
  return photos.slice(0, TILE_COUNT)
})
</script>
