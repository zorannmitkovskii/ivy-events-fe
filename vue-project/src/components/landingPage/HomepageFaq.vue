<template>
  <section class="section" id="faq" style="padding-top: 0">
    <div class="wrap">
      <div class="split">
        <div class="section-head" style="margin: 0">
          <h2>{{ t('home.faq.title') }}</h2>
          <p>{{ t('home.faq.subtitle') }}</p>
          <p style="margin-top: 18px">
            <router-link :to="{ name: 'faq', params: { lang } }">{{ t('home.faq.seeAll') }}</router-link>
          </p>
        </div>

        <!--
          Native `<details>`, which is what the redesign uses and what the
          previous hand-rolled accordion was imitating: a button, an
          `aria-expanded`, a max-height transition and a 420px ceiling picked
          to clear the longest answer in the bundle. All of that was there to
          reproduce behaviour the element already has, including the ceiling
          bug it was working around.

          Only the first three questions here — this is the teaser, and the
          FAQ page is one link away.
        -->
        <div>
          <details v-for="(item, idx) in teaser" :key="idx" :open="idx === 0">
            <summary>{{ item.question }}</summary>
            <p>{{ item.answer }}</p>
          </details>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const TEASER_COUNT = 3

const { tm, t } = useI18n()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const teaser = computed(() => (tm('homepageFaqs') || []).slice(0, TEASER_COUNT))
</script>
