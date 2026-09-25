<template>
  <section class="card" aria-labelledby="agency-vendors">
    <div class="card-head">
      <div>
        <h2 id="agency-vendors">{{ t('agencyWork.vendors.title') }}</h2>
        <p class="lede">{{ t('agencyWork.vendors.subtitle') }}</p>
      </div>
    </div>

    <ul v-if="decisions.length" class="lines">
      <li v-for="decision in decisions" :key="decision.bookingId" class="line">
        <div>
          <b>{{ t('agencyWork.vendors.confirm', { vendor: decision.vendorName }) }}</b>
          <small>{{ [decision.title, decision.eventName, formatDay(decision.eventDate, locale)].filter(Boolean).join(' · ') }}</small>
        </div>
        <span class="pill amber">{{ stageLabel(decision.stage) }}</span>
      </li>
    </ul>
    <p v-else class="empty">{{ t('agencyWork.vendors.empty') }}</p>
  </section>
</template>

<script setup>
/** Vendors that have pencilled a date in and not confirmed it. */
import { useI18n } from 'vue-i18n'
import { formatDay } from '@/utils/agencyFormat.js'

defineProps({
  decisions: { type: Array, required: true },
})

const { t, locale } = useI18n()

function stageLabel(stage) {
  const key = `agencyWork.vendors.stage.${stage || 'TENTATIVE'}`
  const label = t(key)
  return label === key ? t('agencyWork.vendors.waiting') : label
}
</script>

<style scoped src="./agency-panels.css"></style>
