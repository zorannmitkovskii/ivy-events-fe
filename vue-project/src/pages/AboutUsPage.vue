<template>
  <SitePage>
    <section class="page-hero">
      <div class="wrap">
        <Breadcrumb :current="$t('about.title')" />
        <h1>{{ $t('about.heroTitle') }}</h1>
        <p class="lead">{{ $t('about.heroSubtitle') }}</p>
      </div>
    </section>

    <section class="section" style="padding-top: 0">
      <div class="wrap">
        <div class="split">
          <div><h2>{{ $t('about.storyTitle') }}</h2></div>
          <div class="prose" style="font-size: 17px">
            <p>{{ $t('about.storyOrigin') }}</p>
            <p>{{ $t('about.missionText') }}</p>

            <div class="stats">
              <div v-for="stat in stats" :key="stat.value" class="stat">
                <b>{{ stat.value }}</b>
                <span>{{ $t(stat.labelKey) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section" style="padding-top: 0">
      <div class="wrap">
        <div class="section-head"><h2>{{ $t('about.valuesTitle') }}</h2></div>
        <div class="values">
          <div v-for="value in values" :key="value.titleKey" class="value reveal">
            <h3>{{ $t(value.titleKey) }}</h3>
            <p>{{ $t(value.textKey) }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section final">
      <div class="wrap">
        <div>
          <h2>{{ $t('about.talkTitle') }}</h2>
          <p>{{ $t('about.talkBody') }}</p>
        </div>
        <router-link class="btn btn-primary" :to="{ name: 'contact', params: { lang } }">
          {{ $t('about.talkCta') }}
        </router-link>
      </div>
    </section>
  </SitePage>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SitePage from '@/layouts/SitePage.vue'
import Breadcrumb from '@/components/ui/Breadcrumb.vue'

const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

/* Figures, not translations: a year and a city read the same in every locale,
   and only the line under each one changes. */
const stats = [
  { value: '2024', labelKey: 'about.statFirstInvitation' },
  { value: 'MK / EN', labelKey: 'about.statBilingual' },
  { value: 'Скопје', labelKey: 'about.statTeam' },
]

const values = [
  { titleKey: 'about.valueSimplicity', textKey: 'about.valueSimplicityDesc' },
  { titleKey: 'about.valueElegance', textKey: 'about.valueEleganceDesc' },
  { titleKey: 'about.valueInclusion', textKey: 'about.valueInclusionDesc' },
]
</script>
