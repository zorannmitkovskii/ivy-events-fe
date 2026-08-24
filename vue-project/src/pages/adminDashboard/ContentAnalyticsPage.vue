<template>
  <div class="analytics-page">
    <PageHeader :title="t('contentAnalytics.title')">
      <template #actions>
        <p class="sub">{{ t('contentAnalytics.subtitle') }}</p>
      </template>
    </PageHeader>

    <nav class="windows">
      <button v-for="days in WINDOWS" :key="days" class="chip"
              :class="{ active: windowDays === days }" @click="windowDays = days">
        {{ t('contentAnalytics.lastDays', { days }) }}
      </button>
    </nav>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <template v-if="report">
      <dl class="funnel">
        <div>
          <dt>{{ t('contentAnalytics.views') }}</dt>
          <dd>{{ report.contentViews }}</dd>
        </div>
        <div>
          <dt>{{ t('contentAnalytics.vendorClicks') }}</dt>
          <dd>{{ report.vendorClicks }}</dd>
        </div>
        <div>
          <dt>{{ t('contentAnalytics.inquiries') }}</dt>
          <dd>{{ report.inquiriesStarted }}</dd>
        </div>
        <div>
          <dt>{{ t('contentAnalytics.events') }}</dt>
          <dd>{{ report.eventsCreated }}</dd>
        </div>
      </dl>

      <p class="journeys">
        {{ t('contentAnalytics.journeys', {
          withJourney: report.sessionsWithJourney,
          total: report.totalSessions,
        }) }}
        <span v-if="report.totalSessions"> ({{ journeyRate }}%)</span>
      </p>

      <!--
        The attribution model is printed beside the numbers rather than kept in
        a document nobody opens. Two people reading the same figure under
        different assumptions about what counts is how a growth argument goes
        in circles for a month.
      -->
      <p class="model">{{ report.attributionModel }}</p>

      <p class="privacy">{{ t('contentAnalytics.privacy') }}</p>
    </template>
  </div>
</template>

<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'

const WINDOWS = [7, 30, 90]

const { t } = useI18n()

const report = ref(null)
const windowDays = ref(30)
const error = ref('')

const journeyRate = computed(() => {
  if (!report.value?.totalSessions) return 0
  return Math.round((report.value.sessionsWithJourney / report.value.totalSessions) * 100)
})

function unwrap(response) {
  return response?.data ?? response ?? null
}

onMounted(load)
watch(windowDays, load)

async function load() {
  try {
    report.value = unwrap(await contentService.analytics(windowDays.value))
    error.value = ''
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}
</script>

<style scoped>
.analytics-page { padding: 1.5rem; max-width: 720px; }
.page-head h1 { margin: 0; font-size: 1.5rem; }
.sub { color: #666; margin: 0.25rem 0 1rem; }
.windows { display: flex; gap: 0.4rem; margin-bottom: 1.25rem; }
.chip { border: 1px solid #ddd; background: #fff; border-radius: 999px; padding: 0.25rem 0.75rem; cursor: pointer; font-size: 0.85rem; }
.chip.active { background: var(--brand); color: #fff; border-color: var(--brand); }
.error { color: #b3261e; }
.funnel { display: flex; gap: 2rem; flex-wrap: wrap; margin: 0 0 1rem; }
.funnel dt { font-size: 0.8rem; color: #777; }
.funnel dd { margin: 0; font-size: 1.5rem; font-weight: 600; }
.journeys { margin: 0.25rem 0; }
.model { color: #555; font-size: 0.88rem; }
.privacy { color: #777; font-size: 0.82rem; margin-top: 1rem; }
</style>
