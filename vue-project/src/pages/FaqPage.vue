<template>
  <SitePage>
    <section class="page-hero">
      <div class="wrap">
        <Breadcrumb :current="$t('faq.title')" />
        <h1>{{ $t('faq.heroTitle') }}</h1>
        <p class="lead">{{ $t('faq.heroLead') }}</p>
      </div>
    </section>

    <section
      v-for="group in groups"
      :key="group.key"
      class="section"
      style="padding: 0 0 56px"
    >
      <div class="wrap">
        <div class="split">
          <div class="section-head" style="margin: 0">
            <h2>{{ $t(`faq.groups.${group.key}`) }}</h2>
          </div>
          <div>
            <!--
              Native `<details>`, which is what the redesign uses. The previous
              accordion was a button, an `aria-expanded` and a max-height
              transition capped at a pixel value chosen to clear the longest
              answer — all of it reproducing behaviour the element already has,
              including the ceiling bug it was working around.
            -->
            <details
              v-for="(item, idx) in group.items"
              :key="item.question"
              :open="group.key === firstGroupKey && idx === 0"
            >
              <summary>{{ item.question }}</summary>
              <p>{{ item.answer }}</p>
            </details>
          </div>
        </div>
      </div>
    </section>

    <section class="section final">
      <div class="wrap">
        <div>
          <h2>{{ $t('faq.noAnswerTitle') }}</h2>
          <p>{{ $t('faq.noAnswerBody') }}</p>
        </div>
        <router-link class="btn btn-primary" :to="{ name: 'contact', params: { lang } }">
          {{ $t('faq.noAnswerCta') }}
        </router-link>
      </div>
    </section>
  </SitePage>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SitePage from '@/layouts/SitePage.vue'
import Breadcrumb from '@/components/ui/Breadcrumb.vue'

/** The order the design lists them in; anything else follows, in place. */
const GROUP_ORDER = ['invitations', 'pricing', 'guests']

const { tm } = useI18n()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const groups = computed(() => {
  const all = tm('faqPageFaqs') || []
  const byKey = new Map()

  for (const item of all) {
    const key = item.group || GROUP_ORDER[0]
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key).push(item)
  }

  // A question tagged with a group nobody listed still has to appear, so the
  // known order comes first and whatever is left follows rather than vanishing.
  const keys = [...GROUP_ORDER.filter((k) => byKey.has(k)), ...[...byKey.keys()].filter((k) => !GROUP_ORDER.includes(k))]

  return keys.map((key) => ({ key, items: byKey.get(key) }))
})

const firstGroupKey = computed(() => groups.value[0]?.key)
</script>
