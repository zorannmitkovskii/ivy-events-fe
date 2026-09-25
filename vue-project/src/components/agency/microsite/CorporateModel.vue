<template>
  <div class="am-nav">
    <a class="am-logo" href="#am-top" @click.prevent="jumpTo('am-top')">{{ upperName }}<span> /</span></a>
    <nav :aria-label="t('agencySite.nav.label')">
      <a v-if="serviceItems.length" href="#am-capabilities" @click.prevent="jumpTo('am-capabilities')">{{ t('agencySite.nav.services') }}</a>
      <a v-if="formatItems.length" href="#am-formats" @click.prevent="jumpTo('am-formats')">{{ t('agencySite.nav.formats') }}</a>
      <a v-if="steps.length" href="#am-method" @click.prevent="jumpTo('am-method')">{{ t('agencySite.nav.processShort') }}</a>
      <a class="am-nav-cta" href="#am-contact" @click.prevent="jumpTo('am-contact')">{{ t('agencySite.nav.proposal') }} ↗</a>
    </nav>
  </div>

  <section id="am-top" class="am-hero">
    <div class="am-hero-copy">
      <span v-if="hero.eyebrow" class="am-eyebrow" style="color:#6a9788">{{ hero.eyebrow }}</span>
      <h1>{{ hero.title }} <span v-if="hero.titleAccent">{{ hero.titleAccent }}</span></h1>
      <p v-if="hero.text">{{ hero.text }}</p>
      <a class="am-button" href="#am-contact" @click.prevent="jumpTo('am-contact')">{{ hero.ctaLabel || t('agencySite.nav.brief') }} ↗</a>
    </div>
    <div class="am-hero-panel">
      <AmPhoto :url="heroPhoto" :tint="2" :label="site.name" />
      <div class="am-caption">
        <span>{{ hero.caption || site.city }}</span>
        <span v-if="panelCount">01 / {{ String(panelCount).padStart(2, '0') }}</span>
      </div>
    </div>
  </section>

  <div v-if="keywords.length" class="am-stripe">{{ keywords.join('   /   ') }}</div>

  <section v-if="serviceItems.length" id="am-capabilities" class="am-section">
    <div class="am-inner">
      <span v-if="content.services?.eyebrow" class="am-eyebrow">{{ content.services.eyebrow }}</span>
      <h2>{{ content.services?.title }}</h2>
      <div class="am-cards">
        <div v-for="(service, i) in serviceItems" :key="i" class="am-capability">
          <span class="am-symbol">{{ service.symbol || SYMBOLS[i % SYMBOLS.length] }}</span>
          <h3>{{ service.name }}</h3>
          <p>{{ service.description }}</p>
        </div>
      </div>
    </div>
  </section>

  <section v-if="formatItems.length" id="am-formats" class="am-formats">
    <div class="am-inner">
      <span v-if="content.formats?.eyebrow" class="am-eyebrow">{{ content.formats.eyebrow }}</span>
      <h2>{{ content.formats?.title }}</h2>
      <div class="am-format-grid">
        <div v-for="(format, i) in formatItems" :key="i">
          <AmPhoto :url="formatPhoto(format, i)" :tint="i + 1" :label="format.title" />
          <h3>{{ format.title }}</h3>
          <p>{{ format.description }}</p>
        </div>
      </div>
    </div>
  </section>

  <section v-if="steps.length" id="am-method" class="am-section">
    <div class="am-inner am-method">
      <div>
        <span v-if="content.process?.eyebrow" class="am-eyebrow">{{ content.process.eyebrow }}</span>
        <h2>{{ content.process?.title }}</h2>
        <p v-if="content.process?.text" style="font-size:13px;line-height:1.8;color:#607a6a">{{ content.process.text }}</p>
      </div>
      <ul>
        <li v-for="(step, i) in steps" :key="i"><b>{{ pad(i) }}</b> {{ step.title }}</li>
      </ul>
    </div>
  </section>

  <section id="am-contact" class="am-contact">
    <div class="am-inner am-contact-grid">
      <div>
        <span v-if="content.contact?.eyebrow" class="am-eyebrow" style="color:#a9c6ba">{{ content.contact.eyebrow }}</span>
        <h2>{{ content.contact?.title || t('agencySite.contact.fallbackTitle') }}</h2>
        <p v-if="content.contact?.text">{{ content.contact.text }}</p>
      </div>
      <AgencyInquiryForm :slug="site.slug" :preview="preview" />
    </div>
  </section>
</template>

<script setup>
/** 04 · Corporate: capabilities, formats, a method and a brief, for business clients. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AmPhoto from './AmPhoto.vue'
import AgencyInquiryForm from './AgencyInquiryForm.vue'
import { firstPhoto, imageOf, jumpTo, pad } from './siteView'

const props = defineProps({
  site: { type: Object, required: true },
  preview: { type: Boolean, default: false },
})

/** The design's glyphs, for a capability the agency gave none. */
const SYMBOLS = ['◇', '▤', '✳']

const { t } = useI18n()

const content = computed(() => props.site.content)
const hero = computed(() => content.value.hero || {})
const keywords = computed(() => content.value.keywords || [])
const serviceItems = computed(() => content.value.serviceItems || [])
const formatItems = computed(() => content.value.formatItems || [])
const steps = computed(() => content.value.steps || [])
const projects = computed(() => props.site.projects || [])
const upperName = computed(() => String(props.site.name || '').toLocaleUpperCase())
const heroPhoto = computed(() => imageOf(props.site, hero.value.imageKey) || firstPhoto(projects.value[0]))
const panelCount = computed(() => formatItems.value.length || projects.value.length)

function formatPhoto(format, index) {
  return imageOf(props.site, format.imageKey) || firstPhoto(projects.value[index])
}
</script>
