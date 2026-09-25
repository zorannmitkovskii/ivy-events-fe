<template>
  <div v-if="rows.length" class="ec-grid">
    <article v-for="row in rows" :key="row.eventId" class="event-card">
      <div class="ec-top">
        <div>
          <span :class="['pill', row.status === 'DRAFT' ? 'slate' : 'green']">
            {{ row.status === 'DRAFT' ? t('agencyWork.status.DRAFT') : categoryLabel(row.categoryType) }}
          </span>
          <h3>{{ row.name }}</h3>
          <p>{{ [clientLine(row), row.location].filter(Boolean).join(' · ') }}</p>
        </div>
        <span v-if="isOwner && Number(row.plannedBudget)" :class="['pill', overBy(row) > 0 ? 'red' : 'green']">
          {{ overBy(row) > 0
            ? t('agencyWork.budget.over', { amount: formatMoney(overBy(row), currency, locale) })
            : t('agencyWork.budget.used', { n: percent(row.spentBudget, row.plannedBudget) }) }}
        </span>
      </div>

      <dl class="ec-facts">
        <div>
          <dt>{{ t('agencyWork.table.date') }}</dt>
          <dd>{{ formatDay(row.date, locale) || '—' }}<template v-if="row.daysUntil != null"> · {{ t('agencyWork.inDays', { n: row.daysUntil }) }}</template></dd>
        </div>
        <div>
          <dt>{{ isOwner ? t('agencyWork.table.lead') : t('agencyWork.table.myRole') }}</dt>
          <dd>{{ isOwner ? row.lead?.name || t('agencyWork.unassigned') : t(`agencyWork.myRole.${row.myRole || 'ASSISTANT'}`) }}</dd>
        </div>
        <div>
          <dt>{{ isOwner ? t('agencyWork.cards.overdue') : t('agencyWork.cards.myOverdue') }}</dt>
          <dd>{{ isOwner ? row.overdueTasks : row.myOverdueTasks ?? 0 }}</dd>
        </div>
        <div>
          <dt>{{ t('agencyWork.table.rsvp') }}</dt>
          <dd>{{ row.responseRate == null ? '—' : t('agencyWork.table.answered', { n: row.responseRate }) }} · {{ t('agencyWork.table.awaiting', { n: row.awaitingCount }) }}</dd>
        </div>
      </dl>

      <div class="ec-foot">
        <div>
          <small>{{ t('agencyWork.table.nextStep') }}</small>
          <b>{{ row.nextStep?.title || '—' }}</b>
        </div>
        <button type="button" class="ec-open" @click="openEvent(row)">{{ t('agencyWork.open') }} →</button>
      </div>
    </article>
  </div>
  <p v-else class="empty">{{ emptyText }}</p>
</template>

<script setup>
/**
 * The same events as {@link AgencyEventsTable}, as cards — the reading for
 * "what needs me" rather than "how do they compare". Same fields per role.
 */
import { useI18n } from 'vue-i18n'
import { clientLine, formatDay, formatMoney, percent } from '@/utils/agencyFormat.js'
import { useAgencyPreferences } from '@/composables/useAgencyPreferences'
import { useOpenAgencyEvent } from '@/composables/useOpenAgencyEvent'

defineProps({
  rows: { type: Array, required: true },
  isOwner: { type: Boolean, default: false },
  emptyText: { type: String, default: '' },
})

const { t, locale } = useI18n()

/** Amounts are drawn in the agency's own currency, from its settings. */
const { currency, load: loadPreferences } = useAgencyPreferences()
loadPreferences()
const { openEvent } = useOpenAgencyEvent()

const overBy = (row) => Number(row.spentBudget || 0) - Number(row.plannedBudget || 0)

function categoryLabel(category) {
  if (!category) return ''
  const key = `eventTypes.${category}`
  const label = t(key)
  return label === key ? category.charAt(0) + category.slice(1).toLowerCase() : label
}
</script>

<style scoped src="./agency-panels.css"></style>

<style scoped>
.ec-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 0 20px 20px;
}

.event-card {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--card);
}

.ec-top,
.ec-foot {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.event-card h3 {
  margin: 8px 0 4px;
  font-size: 20px;
}

.event-card p {
  margin: 0;
  color: var(--ink-3);
  font-size: 13px;
}

.ec-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 14px 0;
  padding: 14px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.ec-facts dt {
  color: var(--ink-3);
  font-size: 12px;
}

.ec-facts dd {
  margin: 2px 0 0;
  font-size: 13.5px;
  font-weight: 600;
}

.ec-foot {
  align-items: center;
}

.ec-foot small {
  display: block;
  color: var(--ink-3);
  font-size: 12px;
}

.ec-foot b {
  font-size: 13.5px;
}

.ec-open {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  padding: 7px 12px;
  color: var(--ivy);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .ec-grid {
    grid-template-columns: 1fr;
  }
}
</style>
