<template>
  <!-- 01 · Класичен — услуги + доверба: profile, services, work, request. -->
  <div class="vms classic" data-model="classic">
    <header class="site-nav">
      <a class="wordmark" href="#ms-top">{{ vendor.name }}<span>.</span></a>
      <nav :aria-label="t('vendorMicrosite.common.navigation')">
        <a v-if="services.length" href="#ms-services">{{ t('vendorMicrosite.nav.services') }}</a>
        <a v-if="gallery.length" href="#ms-work">{{ t('vendorMicrosite.nav.work') }}</a>
        <a v-if="quote.text" href="#ms-about">{{ t('vendorMicrosite.nav.about') }}</a>
        <a class="nav-cta" href="#ms-contact">{{ t('vendorMicrosite.nav.requestOffer') }} ↗</a>
      </nav>
    </header>

    <section id="ms-top" class="hero">
      <div class="hero-copy">
        <span class="eyebrow">{{ say(hero.eyebrow, 'heroEyebrow', { kind, place }) }}</span>
        <h1>{{ hero.title }} <em v-if="hero.titleAccent">{{ hero.titleAccent }}</em></h1>
        <p v-if="hero.text">{{ hero.text }}</p>
        <div class="hero-actions">
          <a class="ms-button" href="#ms-contact">{{ say(hero.ctaLabel, 'heroCta') }} <span aria-hidden="true">↗</span></a>
          <a v-if="gallery.length" class="line-button" href="#ms-work">{{ say(hero.secondaryLabel, 'heroSecondary') }} ↓</a>
        </div>
      </div>
      <div class="hero-image photo" :class="{ empty: !heroImage }" :style="photoStyle(heroImage)" role="img" :aria-label="vendor.name">
        <div v-if="hero.caption" class="floating">
          {{ hero.caption }}
          <small v-if="hero.captionNote">{{ hero.captionNote }}</small>
        </div>
      </div>
    </section>

    <div v-if="eventTypes.length" class="statement">{{ eventTypes.join('  ✦  ') }}</div>

    <section v-if="services.length" id="ms-services" class="section-pad">
      <div class="section-inner">
        <div class="split-title">
          <div>
            <span class="eyebrow">{{ say(intro('servicesIntro').eyebrow, 'servicesEyebrow') }}</span>
            <h2>{{ say(intro('servicesIntro').title, 'servicesTitle') }}</h2>
          </div>
          <p v-if="intro('servicesIntro').text">{{ intro('servicesIntro').text }}</p>
        </div>
        <div class="service-list">
          <div v-for="(service, index) in services" :key="index" class="service">
            <span class="number">{{ number(index) }}<template v-if="service.label"> / {{ service.label }}</template></span>
            <h3>{{ service.name }}</h3>
            <p v-if="service.description">{{ service.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section v-if="gallery.length" id="ms-work" class="section-pad" :style="services.length ? { paddingTop: '10px' } : {}">
      <div class="section-inner">
        <div class="split-title">
          <div>
            <span class="eyebrow">{{ say(intro('galleryIntro').eyebrow, 'workEyebrow') }}</span>
            <h2>{{ say(intro('galleryIntro').title, 'workTitle') }}</h2>
          </div>
          <p v-if="intro('galleryIntro').text">{{ intro('galleryIntro').text }}</p>
        </div>
        <div class="gallery-three">
          <div
            v-for="item in gallery.slice(0, 3)"
            :key="item.mediaId"
            class="photo"
            :style="photoStyle(item.url)"
            role="img"
            :aria-label="item.caption || vendor.name"
          ></div>
        </div>
      </div>
    </section>

    <section v-if="quote.text" id="ms-about" class="quote">
      <span class="eyebrow">{{ say(quote.eyebrow, 'aboutEyebrow', { name: vendor.name }) }}</span>
      <p>„{{ quote.text }}“</p>
      <span v-if="quote.attribution">{{ quote.attribution }}</span>
    </section>

    <MicrositeExtras :tags="tags" :posts="relatedPosts" :links="links" />

    <MicrositeContact
      id="ms-contact"
      large
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
  content, vendor, say, links, hero, heroImage, gallery, services, eventTypes,
  intro, place, email, tags, relatedPosts, number, kind,
} = useMicrosite(props)

const quote = computed(() => content.value.quote ?? {})
</script>
