<template>
  <section class="card" aria-labelledby="agency-next-steps">
    <div class="card-head">
      <div>
        <h2 id="agency-next-steps">{{ t('agencyWork.nextSteps.title') }}</h2>
        <p class="lede">{{ t('agencyWork.nextSteps.subtitle') }}</p>
      </div>
    </div>

    <ul v-if="steps.length" class="lines">
      <li v-for="row in steps" :key="row.eventId" class="line">
        <div>
          <b>{{ row.nextStep.title }}</b>
          <small>{{ subline(row) }}</small>
        </div>
        <button type="button" class="text-link" @click="openEvent(row, 'tasks')">{{ t('agencyWork.view') }} →</button>
      </li>
    </ul>
    <p v-else class="empty">{{ t('agencyWork.nextSteps.empty') }}</p>
  </section>
</template>

<script setup>
/**
 * A member's next task on each of their events — theirs first, the event's
 * when they have none. The member's version of the owner's team panel: it
 * answers "what do I do next" instead of "who is behind".
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDay } from '@/utils/agencyFormat.js'
import { useOpenAgencyEvent } from '@/composables/useOpenAgencyEvent'

const props = defineProps({
  rows: { type: Array, required: true },
})

const { t, locale } = useI18n()
const { openEvent } = useOpenAgencyEvent()

const steps = computed(() => props.rows.filter((row) => row.nextStep))

function subline(row) {
  const due = row.nextStep.dueAt ? t('agencyWork.nextSteps.due', { date: formatDay(row.nextStep.dueAt, locale.value, { withYear: false }) }) : ''
  const role = row.myRole ? t(`agencyWork.myRole.${row.myRole}`) : ''
  return [row.name, due, role].filter(Boolean).join(' · ')
}
</script>

<style scoped src="./agency-panels.css"></style>
