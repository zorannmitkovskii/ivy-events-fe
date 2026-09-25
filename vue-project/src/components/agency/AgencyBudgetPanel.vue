<template>
  <section class="card" aria-labelledby="agency-budget">
    <div class="card-head">
      <div>
        <h2 id="agency-budget">{{ t('agencyWork.budget.title') }}</h2>
        <p class="lede">{{ t('agencyWork.budget.subtitle') }}</p>
      </div>
      <span v-if="budget.overBudgetEvents" class="pill red">
        {{ t('agencyWork.budget.overCount', { n: budget.overBudgetEvents }) }}
      </span>
    </div>

    <div v-if="featured" class="featured">
      <small>{{ t('agencyWork.budget.usedOf', { name: featured.name }) }}</small>
      <div class="large">
        {{ formatMoney(featured.spent, currency, locale) }}
        <span>/ {{ formatMoney(featured.planned, currency, locale) }}</span>
      </div>
      <div class="bar" :class="{ over: used > 100 }" aria-hidden="true">
        <span :style="{ width: `${Math.min(used, 100)}%` }"></span>
      </div>
      <div class="split">
        <span>{{ t('agencyWork.budget.used', { n: used }) }}</span>
        <strong v-if="remaining >= 0">{{ t('agencyWork.budget.remaining', { amount: formatMoney(remaining, currency, locale) }) }}</strong>
        <strong v-else class="warn">{{ t('agencyWork.budget.over', { amount: formatMoney(-remaining, currency, locale) }) }}</strong>
      </div>

      <ul v-if="others.length" class="lines">
        <li v-for="event in others" :key="event.eventId" class="line">
          <span>{{ event.name }}</span>
          <b>{{ t('agencyWork.budget.used', { n: percent(event.spent, event.planned) }) }}</b>
        </li>
      </ul>
    </div>
    <p v-else class="empty">{{ t('agencyWork.budget.empty') }}</p>

    <p class="note">{{ t('agencyWork.budget.note') }}</p>
  </section>
</template>

<script setup>
/**
 * The events' budgets, most-used first. Owner only.
 *
 * <p>Planned against recorded expenses and nothing else — the note says so,
 * because an agency owner will otherwise read it as revenue or margin.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatMoney, percent } from '@/utils/agencyFormat.js'
import { useAgencyPreferences } from '@/composables/useAgencyPreferences'

const props = defineProps({
  budget: { type: Object, required: true },
})

const { t, locale } = useI18n()

/** Amounts are drawn in the agency's own currency, from its settings. */
const { currency, load: loadPreferences } = useAgencyPreferences()
loadPreferences()

const featured = computed(() => props.budget.events?.[0] || null)
const others = computed(() => (props.budget.events || []).slice(1))
const used = computed(() => percent(featured.value?.spent, featured.value?.planned) ?? 0)
const remaining = computed(() => Number(featured.value?.planned || 0) - Number(featured.value?.spent || 0))
</script>

<style scoped src="./agency-panels.css"></style>

<style scoped>
.featured small {
  color: var(--ink-3);
  font-size: 12.5px;
}

.large {
  margin: 4px 0;
  font-family: var(--display);
  font-size: 26px;
  color: var(--ivy);
}

.large span {
  font-family: var(--ui);
  font-size: 13px;
  color: var(--ink-3);
}

.bar {
  height: 8px;
  margin: 12px 0 8px;
  border-radius: 10px;
  background: var(--mist);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  border-radius: 10px;
  background: var(--moss);
}

.bar.over span {
  background: var(--rose-ink);
}

.split {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--ink-2);
}

.split .warn {
  color: var(--rose-ink);
}

.note {
  margin: 12px 0 0;
  color: var(--ink-3);
  font-size: 12px;
}
</style>
