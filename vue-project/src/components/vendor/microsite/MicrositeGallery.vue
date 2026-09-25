<template>
  <!-- 02 · Галерија — портфолио на прво место: big title, mosaic, services, request. -->
  <div class="vms gallery" data-model="gallery">
    <header class="site-nav">
      <a class="wordmark" href="#ms-top">{{ vendor.name }}<span> /</span></a>
      <nav :aria-label="t('vendorMicrosite.common.navigation')">
        <a v-if="gallery.length" href="#ms-work">{{ t('vendorMicrosite.nav.projects') }}</a>
        <a v-if="services.length" href="#ms-offer">{{ t('vendorMicrosite.nav.services') }}</a>
        <a class="nav-cta" href="#ms-contact">{{ t('vendorMicrosite.nav.contact') }} ↗</a>
      </nav>
    </header>

    <section id="ms-top" class="mast">
      <div class="photo" :class="{ empty: !heroImage }" :style="photoStyle(heroImage)" role="img" :aria-label="vendor.name"></div>
      <div class="mast-copy">
        <span class="eyebrow">{{ say(hero.eyebrow, 'heroEyebrow', { kind, place, name: vendor.name }) }}</span>
        <h1>{{ hero.title }}<template v-if="hero.titleAccent"><br>{{ hero.titleAccent }}</template></h1>
        <p v-if="hero.text">{{ hero.text }}</p>
        <a class="ms-button" :href="gallery.length ? '#ms-work' : '#ms-contact'">{{ say(hero.ctaLabel, 'heroCta') }} ↓</a>
      </div>
    </section>

    <div class="gallery-info">
      <span>{{ place }}</span>
      <strong>{{ tagline || kind }}</strong>
      <span v-if="gallery.length">01 — {{ number(gallery.length - 1) }}</span>
    </div>

    <section v-if="gallery.length" id="ms-work" class="work">
      <div class="work-top">
        <div>
          <span class="eyebrow">{{ say(intro('galleryIntro').eyebrow, 'workEyebrow') }}</span>
          <h2>{{ say(intro('galleryIntro').title, 'workTitle') }}</h2>
        </div>
        <p v-if="intro('galleryIntro').text">{{ intro('galleryIntro').text }}</p>
      </div>
      <div class="mosaic">
        <button
          v-for="(item, index) in gallery"
          :key="item.mediaId"
          type="button"
          class="photo"
          :style="photoStyle(item.url)"
          :aria-label="t('vendorMicrosite.common.zoom', { caption: captionOf(item, index) })"
          @click="open(item, index)"
        ><span>{{ captionOf(item, index) }}</span></button>
      </div>
    </section>

    <section v-if="services.length" id="ms-offer" class="offer">
      <div>
        <span class="eyebrow">{{ say(intro('servicesIntro').eyebrow, 'servicesEyebrow') }}</span>
        <h2>{{ say(intro('servicesIntro').title, 'servicesTitle') }}</h2>
      </div>
      <div>
        <p v-if="intro('servicesIntro').text">{{ intro('servicesIntro').text }}</p>
        <ul>
          <li v-for="(service, index) in services" :key="index"><b>{{ number(index) }}</b> {{ service.name }}</li>
        </ul>
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

    <dialog ref="lightbox" class="lightbox" :aria-label="t('vendorMicrosite.common.photo')" @click.self="close">
      <button type="button" @click="close">{{ t('vendorMicrosite.common.close') }} ✕</button>
      <div class="photo" :style="photoStyle(opened?.url)"></div>
      <p>{{ opened?.caption }}</p>
    </dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MicrositeContact from './MicrositeContact.vue'
import MicrositeExtras from './MicrositeExtras.vue'
import MicrositeFoot from './MicrositeFoot.vue'
import { MICROSITE_PROPS, photoStyle, useMicrosite } from './useMicrosite'

const props = defineProps(MICROSITE_PROPS)
const { t } = useI18n()

const {
  content, vendor, say, links, hero, heroImage, gallery, services,
  intro, place, tags, relatedPosts, number, kind, tagline,
} = useMicrosite(props)

const lightbox = ref(null)
const opened = ref(null)

/** "Прослава · 01", as the design numbers its tiles. */
const captionOf = (item, index) => [item.caption, number(index)].filter(Boolean).join(' · ')

function open(item, index) {
  opened.value = { url: item.url, caption: captionOf(item, index) }
  lightbox.value?.showModal?.()
}

function close() {
  lightbox.value?.close?.()
}
</script>
