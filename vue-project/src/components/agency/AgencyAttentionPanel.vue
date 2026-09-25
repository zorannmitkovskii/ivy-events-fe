<template>
  <section class="card attention" aria-labelledby="agency-attention">
    <div class="card-head">
      <div>
        <h2 id="agency-attention">{{ t('agencyWork.attention.title') }}</h2>
        <p class="lede">{{ t('agencyWork.attention.subtitle') }}</p>
      </div>
      <span v-if="eventCount" class="pill red">{{ t('agencyWork.attention.events', { n: eventCount }) }}</span>
    </div>

    <div class="segments" role="group" :aria-label="t('agencyWork.attention.filterLabel')">
      <button
        v-for="segment in SEGMENTS"
        :key="segment"
        type="button"
        :aria-pressed="active === segment"
        :class="{ selected: active === segment }"
        @click="active = segment"
      >{{ t(`agencyWork.attention.segment.${segment}`) }}</button>
    </div>

    <ul v-if="shown.length" class="items">
      <li v-for="item in shown" :key="`${item.eventId}-${item.kind}`" class="item">
        <span :class="['dot', item.kind === 'TASKS' ? 'red' : 'amber']" aria-hidden="true"></span>
        <div class="body">
          <h3>
            {{ item.eventName }}
            <span :class="['pill', item.kind === 'TASKS' ? 'red' : 'amber']">{{ t(`agencyWork.attention.kind.${item.kind}`) }}</span>
          </h3>
          <p>{{ message(item) }}</p>
        </div>
        <button type="button" class="text-link" @click="openEvent(rowOf(item.eventId), SECTION[item.kind])">
          {{ t('agencyWork.open') }} →
        </button>
      </li>
    </ul>
    <p v-else class="empty">{{ t('agencyWork.attention.empty') }}</p>
  </section>
</template>

<script setup>
/**
 * "Needs attention": what can hold an event back, soonest event first.
 *
 * <p>Three kinds, filterable, each one sentence built from the server's
 * numbers — overdue tasks, guests who have not answered close to the date, and
 * vendors that have pencilled the date in without confirming it.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOpenAgencyEvent } from '@/composables/useOpenAgencyEvent'

const props = defineProps({
  items: { type: Array, required: true },
  /** The rows the items belong to, so an event opens with its category and status. */
  events: { type: Array, default: () => [] },
})

const SEGMENTS = ['ALL', 'TASKS', 'GUESTS', 'VENDORS']

/** Where "open" goes for each kind: the screen where the problem is fixed. */
const SECTION = { TASKS: 'tasks', GUESTS: 'guests', VENDORS: 'overview' }

const { t } = useI18n()
const { openEvent } = useOpenAgencyEvent()

const active = ref('ALL')

const shown = computed(() =>
  active.value === 'ALL' ? props.items : props.items.filter((item) => item.kind === active.value),
)

const rowOf = (eventId) => props.events.find((row) => row.eventId === eventId) || { eventId }

const eventCount = computed(() => new Set(props.items.map((item) => item.eventId)).size)

function message(item) {
  const when = item.daysUntil == null ? '' : t('agencyWork.inDays', { n: item.daysUntil })
  const lead = item.lead?.name || t('agencyWork.unassigned')
  if (item.kind === 'TASKS') return t('agencyWork.attention.tasks', { n: item.count, when, lead })
  if (item.kind === 'GUESTS') return t('agencyWork.attention.guests', { n: item.count, when })
  return t('agencyWork.attention.vendors', { n: item.count, names: (item.subjects || []).join(', ') })
}
</script>

<style scoped>
.lede {
  margin-top: 4px;
  color: var(--ink-3);
  font-size: 13px;
}

.segments {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  overflow-x: auto;
}

.segments button {
  padding: 6px 11px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--ink-2);
  font-size: 13px;
  white-space: nowrap;
}

.segments button.selected {
  background: var(--mist);
  color: var(--ivy);
  font-weight: 700;
}

.items {
  list-style: none;
  margin: 0;
  padding: 0;
}

.item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 2px;
  border-top: 1px solid var(--line);
}

.item h3 {
  margin: 0 0 3px;
  font-family: var(--ui);
  font-size: 14px;
  font-weight: 600;
}

.item p {
  margin: 0;
  color: var(--ink-2);
  font-size: 13px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  align-self: start;
  margin-top: 6px;
}

.dot.red {
  background: var(--rose-ink);
}

.dot.amber {
  background: var(--gold);
}

.pill {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 7px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
  vertical-align: 1px;
}

.pill.red {
  background: var(--rose);
  color: var(--rose-ink);
}

.pill.amber {
  background: var(--gold-soft);
  color: var(--gold-deep);
}

.text-link {
  border: 0;
  background: none;
  color: var(--ivy);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.text-link:hover {
  text-decoration: underline;
}

.empty {
  padding: 18px 0 4px;
  color: var(--ink-3);
  font-size: 14px;
}
</style>
