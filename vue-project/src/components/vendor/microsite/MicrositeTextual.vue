<template>
  <!-- 04 · Текстуален — уреднички стил: approach, services, questions, request. -->
  <div class="vms textual" data-model="textual">
    <header class="site-nav">
      <a class="wordmark" href="#ms-top">{{ vendor.name }} /</a>
      <nav :aria-label="t('vendorMicrosite.common.navigation')">
        <a v-if="approach.title" href="#ms-approach">{{ t('vendorMicrosite.nav.approach') }}</a>
        <a v-if="services.length" href="#ms-services">{{ t('vendorMicrosite.nav.services') }}</a>
        <a v-if="faq.length" href="#ms-faq">{{ t('vendorMicrosite.nav.faq') }}</a>
        <a class="nav-cta" href="#ms-contact">{{ t('vendorMicrosite.nav.contact') }} ↗</a>
      </nav>
    </header>

    <section id="ms-top" class="hero">
      <div class="hero-inner">
        <span class="eyebrow">{{ say(hero.eyebrow, 'heroEyebrow', { kind, place }) }}</span>
        <h1>{{ hero.title }} <i v-if="hero.titleAccent">{{ hero.titleAccent }}</i></h1>
        <div class="hero-bottom">
          <p v-if="hero.text">{{ hero.text }}</p>
          <a class="ms-button" href="#ms-contact">{{ say(hero.ctaLabel, 'heroCta') }} ↗</a>
        </div>
      </div>
    </section>

    <section v-if="gallery.length" class="folio">
      <div class="section-inner folio-layout">
        <div v-for="(item, index) in gallery.slice(0, 2)" :key="item.mediaId">
          <div class="photo" :class="{ secondary: index === 1 }" :style="photoStyle(item.url)" role="img" :aria-label="item.caption || vendor.name"></div>
          <p v-if="item.caption" class="caption">{{ number(index) }} / {{ item.caption }}</p>
        </div>
      </div>
    </section>

    <section v-if="approach.title || approach.text" id="ms-approach" class="big-note">
      <div class="section-inner">
        <span class="eyebrow">{{ say(approach.eyebrow, 'approachEyebrow') }}</span>
        <h2 v-if="approach.title">{{ approach.title }}</h2>
        <p v-if="approach.text">{{ approach.text }}</p>
      </div>
    </section>

    <section v-if="services.length" id="ms-services" class="services">
      <div class="section-inner">
        <span class="eyebrow">{{ say(intro('servicesIntro').eyebrow, 'servicesEyebrow') }}</span>
        <h2 class="heading">{{ say(intro('servicesIntro').title, 'servicesTitle') }}</h2>
        <div v-for="(service, index) in services" :key="index" class="service-row">
          <span>{{ number(index) }} /</span>
          <h3>{{ service.name }}</h3>
          <p v-if="service.description">{{ service.description }}</p>
        </div>
      </div>
    </section>

    <section v-if="faq.length" id="ms-faq" class="faq">
      <div class="section-inner">
        <span class="eyebrow">{{ say(intro('faqIntro').eyebrow, 'faqEyebrow') }}</span>
        <h2>{{ say(intro('faqIntro').title, 'faqTitle') }}</h2>
        <details v-for="(item, index) in faq" :key="index">
          <summary>{{ item.question }}</summary>
          <p>{{ item.answer }}</p>
        </details>
      </div>
    </section>

    <MicrositeExtras :tags="tags" :posts="relatedPosts" :links="links" />

    <MicrositeContact
      id="ms-contact"
      :eyebrow="say(intro('contact').eyebrow, 'contactEyebrow')"
      :title="say(intro('contact').title, 'contactTitle')"
      :text="say(intro('contact').text, 'contactText')"
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
  content, vendor, say, links, hero, gallery, services, faq,
  intro, place, tags, relatedPosts, number, kind,
} = useMicrosite(props)

const approach = computed(() => intro('approach'))
</script>
