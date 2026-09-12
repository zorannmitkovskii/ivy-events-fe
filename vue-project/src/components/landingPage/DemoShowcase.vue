<template>
  <section class="demos section" id="demo" aria-labelledby="demo-title">
    <div class="wrap">
      <div class="cats-head">
        <div class="section-head" style="margin: 0">
          <h2 id="demo-title">{{ $t('home.demos.title') }}</h2>
          <p>{{ $t('home.demos.subtitle') }}</p>
        </div>
        <router-link class="btn btn-ghost btn-sm" :to="designsTo">{{ $t('eventCategories.allDesigns') }}</router-link>
      </div>

      <div class="demo-grid">
        <article v-for="demo in DEMOS" :key="demo.key" class="demo-card">
          <!-- A laptop and two phones, drawn in CSS. The invitation is the
               product, so the card shows it on the two screens it is opened on
               rather than describing it. -->
          <div class="mock" :class="`tone-${demo.tone}`">
            <div class="laptop">
              <div class="lscreen">
                <span class="flap-s"></span>
                <span class="seal-s">{{ demo.seal }}</span>
              </div>
              <div class="lbase"></div>
            </div>
            <div class="mphone a">
              <small>{{ $t(`home.demos.cards.${demo.key}.line`) }}</small>
              <b>{{ $t(`home.demos.cards.${demo.key}.name`) }}</b>
              <span>{{ $t(`home.demos.cards.${demo.key}.when`) }}</span>
            </div>
            <div class="mphone b">
              <small>{{ $t('home.demos.rsvp') }}</small>
              <i>{{ $t('home.demos.yes') }}</i>
              <i class="o">{{ $t('home.demos.no') }}</i>
            </div>
          </div>

          <h3>{{ demo.title }}</h3>
          <p>{{ $t(`home.demos.cards.${demo.key}.about`) }}</p>

          <button type="button" class="btn btn-ghost demo-open" @click="open(demo)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m10 9 5 3-5 3z" fill="currentColor" />
            </svg>{{ $t('home.demos.watch') }}
          </button>
        </article>
      </div>
    </div>

    <DemoModal :demo="openDemo" @close="openDemo = null" />
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import DemoModal from '@/components/landingPage/DemoModal.vue'

/*
  Finished invitations, as clients actually received them.

  `src` is the screen recording for each. Empty for now — the modal says so in
  words rather than opening an empty player, and the moment an .mp4 lands in
  `public/demo/` it plays. The names and the seals are the real ones from the
  mockup; they are product names, not copy to translate.
*/
const DEMOS = [
  { key: 'wedding', tone: 'sage', seal: 'Мр', title: 'Royal Letter: Royal Garden', src: '' },
  { key: 'birthday', tone: 'sky', seal: 'Л1', title: 'Teddy Bear: Baby Birthday', src: '' },
  { key: 'corporate', tone: 'night', seal: 'Се', title: 'Royal Letter: Business Edition', src: '' },
]

const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')
const designsTo = computed(() => ({ name: 'designs', params: { lang: lang.value } }))

const openDemo = ref(null)

function open(demo) {
  openDemo.value = { title: demo.title, src: demo.src }
}
</script>
