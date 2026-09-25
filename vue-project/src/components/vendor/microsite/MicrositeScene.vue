<template>
  <!-- 03 · Сцена — визуелна приказна: story, chapters, process, request. -->
  <div class="vms scene" data-model="scene">
    <header class="site-nav">
      <a class="wordmark" href="#ms-top">{{ vendor.name }}.</a>
      <nav :aria-label="t('vendorMicrosite.common.navigation')">
        <a v-if="chapters.length" href="#ms-story">{{ t('vendorMicrosite.nav.story') }}</a>
        <a href="#ms-process">{{ t('vendorMicrosite.nav.process') }}</a>
        <a class="nav-cta" href="#ms-contact">{{ t('vendorMicrosite.nav.sendRequest') }} ↗</a>
      </nav>
    </header>

    <section id="ms-top" class="hero">
      <div class="photo" :class="{ empty: !heroImage }" :style="photoStyle(heroImage)" role="img" :aria-label="vendor.name"></div>
      <div class="hero-copy">
        <span class="eyebrow">{{ say(hero.eyebrow, 'heroEyebrow', { kind, place }) }}</span>
        <h1>{{ hero.title }}<template v-if="hero.titleAccent"> {{ hero.titleAccent }}</template></h1>
        <p v-if="hero.text">{{ hero.text }}</p>
        <a class="ms-button" :href="chapters.length ? '#ms-story' : '#ms-contact'">{{ say(hero.ctaLabel, 'heroCta') }} ↓</a>
      </div>
      <div class="frame-note" aria-hidden="true">{{ vendor.name }} / {{ year }}</div>
    </section>

    <section v-if="approach.title || approach.text" class="intro">
      <div class="section-inner">
        <span class="eyebrow">{{ say(approach.eyebrow, 'introEyebrow') }}</span>
        <h2 v-if="approach.title">{{ approach.title }}</h2>
        <p v-if="approach.text">{{ approach.text }}</p>
      </div>
    </section>

    <section v-if="chapters.length" id="ms-story">
      <div v-for="(chapter, index) in chapters" :key="index" class="chapter" :class="{ reverse: index % 2 === 1 }">
        <div class="photo" :class="{ empty: !chapter.url }" :style="photoStyle(chapter.url)" role="img" :aria-label="chapter.title || vendor.name"></div>
        <div class="chapter-copy">
          <span class="eyebrow">{{ chapter.eyebrow || t('vendorMicrosite.scene.chapter', { n: number(index) }) }}</span>
          <h2 v-if="chapter.title">{{ chapter.title }}</h2>
          <p v-if="chapter.text">{{ chapter.text }}</p>
          <a class="line-button" href="#ms-contact">{{ say(chapter.ctaLabel, 'chapterCta') }} ↗</a>
        </div>
      </div>
    </section>

    <section id="ms-process" class="timeline">
      <div class="section-inner">
        <span class="eyebrow">{{ say(intro('processIntro').eyebrow, 'processEyebrow') }}</span>
        <h2>{{ say(intro('processIntro').title, 'processTitle') }}</h2>
        <div class="steps">
          <div v-for="(step, index) in steps" :key="index" class="step">
            <span>{{ number(index) }}.</span>
            <h3>{{ step.title }}</h3>
            <p v-if="step.description">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <MicrositeExtras :tags="tags" :posts="relatedPosts" :links="links" />

    <MicrositeContact
      id="ms-contact"
      :eyebrow="say(intro('contact').eyebrow, 'contactEyebrow')"
      :title="say(intro('contact').title, 'contactTitle')"
      :text="say(intro('contact').text, 'contactText')"
      :place="place"
      :email="email"
      :slug="slug"
      :form-disabled="formDisabled"
    />

    <MicrositeFoot :vendor="vendor" :text="say(content.footer, 'footer', { name: vendor.name })" top-href="#ms-top" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MicrositeContact from './MicrositeContact.vue'
import MicrositeExtras from './MicrositeExtras.vue'
import MicrositeFoot from './MicrositeFoot.vue'
import { MICROSITE_PROPS, photoStyle, useMicrosite } from './useMicrosite'

const props = defineProps(MICROSITE_PROPS)
const { t } = useI18n()

const {
  content, vendor, say, links, hero, heroImage, chapters, steps,
  intro, place, email, tags, relatedPosts, number, kind,
} = useMicrosite(props)

const approach = computed(() => intro('approach'))
const year = new Date().getFullYear()
</script>
