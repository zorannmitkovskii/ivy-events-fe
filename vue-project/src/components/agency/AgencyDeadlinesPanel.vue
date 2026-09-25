<template>
  <section class="card deadlines" aria-labelledby="agency-deadlines">
    <div class="card-head">
      <div>
        <h2 id="agency-deadlines">{{ t('agencyWork.deadlines.title') }}</h2>
        <p class="lede">{{ t('agencyWork.deadlines.window', { from: formatDay(today, locale, { withYear: false }), to: formatDay(windowEnd, locale, { withYear: false }) }) }}</p>
      </div>
      <select
        class="sel"
        :value="range"
        :aria-label="t('agencyWork.deadlines.rangeLabel')"
        @change="$emit('update:range', Number($event.target.value))"
      >
        <option v-for="days in RANGES" :key="days" :value="days">{{ t('agencyWork.deadlines.nextDays', { n: days }) }}</option>
      </select>
    </div>

    <ol v-if="items.length" class="timeline">
      <li v-for="(item, index) in items" :key="`${item.date}-${item.kind}-${item.eventId}-${index}`" class="entry">
        <div class="when">
          <strong>{{ dayOfMonth(item.date) }}</strong>
          {{ monthOf(item.date) }}
        </div>
        <span class="rail" :class="{ first: index === 0 }" aria-hidden="true"></span>
        <div class="what">
          <b>{{ title(item) }}</b>
          <span class="tag">{{ t(`agencyWork.deadlines.kind.${item.kind}`) }}</span>
          <p>{{ subline(item) }}</p>
        </div>
      </li>
    </ol>
    <p v-else class="empty">{{ t('agencyWork.deadlines.empty') }}</p>
  </section>
</template>

<script setup>
/**
 * "This week": dated work between today and the end of the chosen range —
 * task deadlines, RSVP deadlines and the event days themselves, on one rail.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDay } from '@/utils/agencyFormat.js'

const props = defineProps({
  items: { type: Array, required: true },
  range: { type: Number, required: true },
  today: { type: String, required: true },
})

defineEmits(['update:range'])

const RANGES = [7, 14]

const { t, locale } = useI18n()

const windowEnd = computed(() => {
  const end = new Date(`${props.today}T12:00:00`)
  end.setDate(end.getDate() + props.range)
  return end.toISOString().slice(0, 10)
})

const dayOfMonth = (iso) => String(iso).slice(8, 10)
const monthOf = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale.value, { month: 'short' })

function title(item) {
  if (item.kind === 'EVENT_DAY') return t('agencyWork.deadlines.eventDay', { name: item.eventName })
  if (item.kind === 'RSVP_DEADLINE') return t('agencyWork.deadlines.rsvpDeadline')
  return item.title
}

function subline(item) {
  const owner = item.assignee?.name ? t('agencyWork.deadlines.assignee', { name: item.assignee.name }) : ''
  return [item.eventName, owner].filter(Boolean).join(' · ')
}
</script>

<style scoped>
.lede {
  margin-top: 4px;
  color: var(--ink-3);
  font-size: 13px;
}

.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
}

.entry {
  display: grid;
  grid-template-columns: 44px 16px 1fr;
  gap: 8px;
  min-height: 58px;
}

.when {
  text-align: center;
  font-size: 11px;
  color: var(--ink-3);
  line-height: 1.15;
}

.when strong {
  display: block;
  font-family: var(--display);
  font-size: 19px;
  font-weight: 400;
  color: var(--ivy);
}

.rail {
  position: relative;
  display: flex;
  justify-content: center;
}

.rail::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--line);
}

.rail::after {
  content: '';
  position: relative;
  top: 7px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--moss);
  box-shadow: 0 0 0 2px var(--card);
}

.rail.first::after {
  background: var(--gold);
}

.what {
  padding-bottom: 12px;
}

.what b {
  font-size: 14px;
  font-weight: 600;
}

.what p {
  margin: 3px 0 0;
  color: var(--ink-3);
  font-size: 12.5px;
}

.tag {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 6px;
  background: var(--mist-2);
  color: var(--ink-2);
  font-size: 11px;
  font-weight: 700;
}

.empty {
  padding: 18px 0 4px;
  color: var(--ink-3);
  font-size: 14px;
}
</style>
