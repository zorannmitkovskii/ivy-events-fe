<template>
  <div class="am-nav">
    <a class="am-logo" href="#am-top" @click.prevent="jumpTo('am-top')">{{ site.name }}<i>.</i></a>
    <nav :aria-label="t('agencySite.nav.label')">
      <a v-if="serviceItems.length" href="#am-services" @click.prevent="jumpTo('am-services')">{{ t('agencySite.nav.services') }}</a>
      <a v-if="projects.length" href="#am-projects" @click.prevent="jumpTo('am-projects')">{{ t('agencySite.nav.events') }}</a>
      <a v-if="steps.length" href="#am-process" @click.prevent="jumpTo('am-process')">{{ t('agencySite.nav.process') }}</a>
      <a class="am-nav-cta" href="#am-contact" @click.prevent="jumpTo('am-contact')">{{ t('agencySite.nav.sendRequest') }} ↗</a>
    </nav>
  </div>

  <section id="am-top" class="am-hero">
    <div class="am-hero-copy">
      <span v-if="hero.eyebrow" class="am-eyebrow">{{ hero.eyebrow }}</span>
      <h1>{{ hero.title }} <em v-if="hero.titleAccent">{{ hero.titleAccent }}</em></h1>
      <p v-if="hero.text">{{ hero.text }}</p>
      <div class="am-hero-cta">
        <a class="am-button" href="#am-contact" @click.prevent="jumpTo('am-contact')">{{ hero.ctaLabel || t('agencySite.nav.talk') }} ↗</a>
        <a v-if="hero.secondaryLabel" class="am-text-link" :href="`#${secondaryTarget}`"
           @click.prevent="jumpTo(secondaryTarget)">{{ hero.secondaryLabel }} ↓</a>
      </div>
    </div>
    <AmPhoto class="am-hero-image" :url="heroPhoto" :tint="0" :label="site.name">
      <div v-if="hero.caption" class="am-hero-caption">{{ hero.caption }}<small>{{ hero.captionNote || site.city }}</small></div>
    </AmPhoto>
  </section>

  <div v-if="keywords.length" class="am-band">{{ keywords.join('  ✦  ') }}</div>

  <section v-if="serviceItems.length" id="am-services" class="am-section">
    <div class="am-inner">
      <div class="am-section-lead">
        <div>
          <span v-if="content.services?.eyebrow" class="am-eyebrow">{{ content.services.eyebrow }}</span>
          <h2>{{ content.services?.title }}</h2>
        </div>
        <p v-if="content.services?.text">{{ content.services.text }}</p>
      </div>
      <div class="am-service-grid">
        <div v-for="(service, i) in serviceItems" :key="i" class="am-service">
          <small>{{ service.label || pad(i) }}</small>
          <h3>{{ service.name }}</h3>
          <p>{{ service.description }}</p>
        </div>
      </div>
    </div>
  </section>

  <section v-if="projects.length" id="am-projects" class="am-section" :style="serviceItems.length ? 'padding-top:10px' : null">
    <div class="am-inner">
      <div class="am-section-lead">
        <div>
          <span v-if="content.projects?.eyebrow" class="am-eyebrow">{{ content.projects.eyebrow }}</span>
          <h2>{{ content.projects?.title }}</h2>
        </div>
        <p v-if="content.projects?.text">{{ content.projects.text }}</p>
      </div>
      <div class="am-case-grid">
        <div v-for="(project, i) in projects.slice(0, MAX_CASES)" :key="project.id">
          <AmPhoto :url="firstPhoto(project)" :tint="i + 2" :label="project.title" />
          <h3>{{ project.title }}</h3>
          <p>{{ projectMeta(project) }}</p>
        </div>
      </div>
    </div>
  </section>

  <section v-if="steps.length" id="am-process" class="am-section" style="background:#f0f3eb">
    <div class="am-inner">
      <span v-if="content.process?.eyebrow" class="am-eyebrow">{{ content.process.eyebrow }}</span>
      <h2>{{ content.process?.title }}</h2>
      <div class="am-steps">
        <div v-for="(step, i) in steps" :key="i" class="am-step">
          <b>{{ pad(i) }}</b>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </div>
      </div>
    </div>
  </section>

  <section id="am-contact" class="am-contact">
    <div class="am-inner am-contact-grid">
      <div>
        <span v-if="content.contact?.eyebrow" class="am-eyebrow">{{ content.contact.eyebrow }}</span>
        <h2>{{ content.contact?.title || t('agencySite.contact.fallbackTitle') }}</h2>
        <p v-if="content.contact?.text">{{ content.contact.text }}</p>
        <p v-if="site.email || site.city">
          <template v-if="site.email"><strong>{{ t('agencySite.contact.email') }}:</strong> {{ site.email }}<br /></template>
          <template v-if="site.city"><strong>{{ t('agencySite.contact.location') }}:</strong> {{ site.city }}</template>
        </p>
      </div>
      <AgencyInquiryForm :slug="site.slug" :preview="preview" />
    </div>
  </section>
</template>

<script setup>
/** 01 · Classic: services, realised events, process and the form on one clear page. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AmPhoto from './AmPhoto.vue'
import AgencyInquiryForm from './AgencyInquiryForm.vue'
import { firstPhoto, imageOf, jumpTo, pad, projectMeta } from './siteView'

const props = defineProps({
  site: { type: Object, required: true },
  preview: { type: Boolean, default: false },
})

/** The design's grid holds three cases; more belong in the portfolio layout. */
const MAX_CASES = 3

const { t } = useI18n()

const content = computed(() => props.site.content)
const hero = computed(() => content.value.hero || {})
const keywords = computed(() => content.value.keywords || [])
const serviceItems = computed(() => content.value.serviceItems || [])
const steps = computed(() => content.value.steps || [])
const projects = computed(() => props.site.projects || [])
const heroPhoto = computed(() => imageOf(props.site, hero.value.imageKey) || firstPhoto(projects.value[0]))
const secondaryTarget = computed(() => (projects.value.length ? 'am-projects' : 'am-process'))
</script>
