<template>
  <div class="am-nav">
    <a class="am-logo" href="#am-top" @click.prevent="jumpTo('am-top')">{{ site.name }}</a>
    <nav :aria-label="t('agencySite.nav.label')">
      <a v-if="chapters.length || statement" href="#am-story" @click.prevent="jumpTo('am-story')">{{ t('agencySite.nav.approach') }}</a>
      <a v-if="steps.length" href="#am-method" @click.prevent="jumpTo('am-method')">{{ t('agencySite.nav.processShort') }}</a>
      <a class="am-nav-cta" href="#am-contact" @click.prevent="jumpTo('am-contact')">{{ t('agencySite.nav.contact') }} ↗</a>
    </nav>
  </div>

  <section id="am-top" class="am-hero">
    <div class="am-hero-copy">
      <span v-if="hero.eyebrow" class="am-eyebrow" style="color:#a67d5f">{{ hero.eyebrow }}</span>
      <h1>{{ hero.title }} <em v-if="hero.titleAccent">{{ hero.titleAccent }}</em></h1>
      <p v-if="hero.text">{{ hero.text }}</p>
      <a class="am-button" href="#am-story" @click.prevent="jumpTo(chapters.length || statement ? 'am-story' : 'am-contact')">
        {{ hero.secondaryLabel || hero.ctaLabel || t('agencySite.nav.talk') }} ↓
      </a>
    </div>
    <AmPhoto :url="heroPhoto" :tint="5" :label="site.name" />
  </section>

  <div id="am-story">
    <section v-if="statement" class="am-statement">
      <div class="am-inner">
        <span v-if="statement.eyebrow" class="am-eyebrow" style="color:#a67d5f">{{ statement.eyebrow }}</span>
        <h2>{{ statement.title }}</h2>
        <p v-if="statement.text">{{ statement.text }}</p>
      </div>
    </section>

    <section v-if="chapters.length">
      <div v-for="(chapter, i) in chapters" :key="i" class="am-chapter">
        <AmPhoto :url="chapterPhoto(chapter, i)" :tint="i + 3" :label="chapter.title" />
        <div class="am-chapter-copy">
          <span v-if="chapter.eyebrow" class="am-eyebrow" style="color:#ad8060">{{ chapter.eyebrow }}</span>
          <h2>{{ chapter.title }}</h2>
          <p v-if="chapter.text">{{ chapter.text }}</p>
        </div>
      </div>
    </section>
  </div>

  <section v-if="steps.length" id="am-method" class="am-approach">
    <div class="am-inner">
      <span v-if="content.process?.eyebrow" class="am-eyebrow">{{ content.process.eyebrow }}</span>
      <h2>{{ content.process?.title }}</h2>
      <div class="am-approach-grid">
        <div v-for="(step, i) in steps" :key="i">
          <b>{{ pad(i) }}.</b>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </div>
      </div>
    </div>
  </section>

  <section id="am-contact" class="am-contact">
    <div class="am-inner am-contact-grid">
      <div>
        <span v-if="content.contact?.eyebrow" class="am-eyebrow" style="color:#e4c7ac">{{ content.contact.eyebrow }}</span>
        <h2>{{ content.contact?.title || t('agencySite.contact.fallbackTitle') }}</h2>
        <p v-if="content.contact?.text">{{ content.contact.text }}</p>
      </div>
      <AgencyInquiryForm :slug="site.slug" :preview="preview" />
    </div>
  </section>
</template>

<script setup>
/** 03 · Editorial: a story about how the agency works, told in chapters. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AmPhoto from './AmPhoto.vue'
import AgencyInquiryForm from './AgencyInquiryForm.vue'
import { firstPhoto, imageOf, jumpTo, pad } from './siteView'

const props = defineProps({
  site: { type: Object, required: true },
  preview: { type: Boolean, default: false },
})

const { t } = useI18n()

const content = computed(() => props.site.content)
const hero = computed(() => content.value.hero || {})
const statement = computed(() => (content.value.statement?.title ? content.value.statement : null))
const chapters = computed(() => content.value.chapters || [])
const steps = computed(() => content.value.steps || [])
const projects = computed(() => props.site.projects || [])
const heroPhoto = computed(() => imageOf(props.site, hero.value.imageKey) || firstPhoto(projects.value[0]))

/** A chapter without its own photo borrows one from the portfolio, in order. */
function chapterPhoto(chapter, index) {
  return imageOf(props.site, chapter.imageKey) || firstPhoto(projects.value[index + 1])
}
</script>
