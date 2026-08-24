<template>
  <article class="card" :class="{ 'card--compact': compact, 'card--urgent': urgent }">
    <!--
      The hero is decorative and deliberately not an <img>: a broken or missing
      cover must not leave a torn icon in a grid of twenty. Absent, the gradient
      stands in and the card reads exactly the same.
    -->
    <div v-if="!compact" class="hero" :style="heroStyle">
      <span class="hero-type">{{ typeLabel }}</span>
      <span v-if="countdown" class="hero-countdown" :class="{ 'is-past': daysLeft < 0 }">
        {{ countdown }}
      </span>
      <button
        class="pin"
        :class="{ 'pin--on': event.pinned }"
        :aria-pressed="event.pinned"
        :title="event.pinned ? t('organizerOverview.unpin') : t('organizerOverview.pin')"
        @click.stop="$emit('pin')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" :fill="event.pinned ? 'currentColor' : 'none'"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
        </svg>
      </button>
    </div>

    <div class="body">
      <h3 class="name">{{ event.name || t('organizerOverview.untitled') }}</h3>

      <p class="meta">
        <span>{{ formattedDate }}</span>
        <span v-if="locationName"> · {{ locationName }}</span>
      </p>

      <template v-if="!compact">
        <dl class="stats">
          <div v-if="guestCount !== null">
            <dt>{{ t('organizerOverview.colGuests') }}</dt>
            <dd>{{ guestCount }}</dd>
          </div>
          <div v-if="invited">
            <dt>{{ t('organizerOverview.colRsvp') }}</dt>
            <dd>{{ confirmed }} / {{ invited }}</dd>
          </div>
        </dl>

        <div v-if="invited" class="rsvp" :aria-label="t('organizerOverview.colRsvp')">
          <div class="rsvp-fill" :style="{ width: rsvpPercent + '%' }"></div>
        </div>

        <!-- Only when there is something wrong. A row reading "0 overdue" on
             every card is noise that hides the one card where it is not zero. -->
        <p v-if="overdue" class="overdue">{{ t('organizerOverview.overdueTasks', { count: overdue }) }}</p>
      </template>

      <div class="actions">
        <button class="open" @click="$emit('open')">{{ t('organizerOverview.manage') }}</button>
        <span class="status" :class="'status--' + statusKey">{{ statusLabel }}</span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  event: { type: Object, required: true },
  compact: { type: Boolean, default: false },
  urgent: { type: Boolean, default: false },
})

defineEmits(['open', 'pin'])

const { t, locale } = useI18n()

const metrics = computed(() => props.event.metrics || null)
const guestCount = computed(() => metrics.value?.guestCount ?? null)
const confirmed = computed(() => metrics.value?.confirmedCount ?? 0)
const overdue = computed(() => metrics.value?.overdueTaskCount ?? 0)

const invited = computed(() => {
  const m = metrics.value
  if (!m) return 0
  return (m.confirmedCount || 0) + (m.awaitingCount || 0) + (m.declinedCount || 0)
})

const rsvpPercent = computed(() =>
  invited.value ? Math.round((confirmed.value / invited.value) * 100) : 0)

const eventDate = computed(() => props.event.date || props.event.eventDate || null)

const formattedDate = computed(() => {
  if (!eventDate.value) return t('organizerOverview.noDate')
  return new Date(eventDate.value).toLocaleDateString(locale.value, {
    day: 'numeric', month: 'long', year: 'numeric',
  })
})

const locationName = computed(() =>
  props.event.location?.name || props.event.location?.city || '')

/** Whole days, from midnight to midnight — "tomorrow" must not depend on the
 *  hour somebody happens to open the page. */
const daysLeft = computed(() => {
  if (!eventDate.value) return null
  const day = new Date(eventDate.value)
  day.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((day - today) / 86400000)
})

const countdown = computed(() => {
  const d = daysLeft.value
  if (d === null) return ''
  if (d === 0) return t('organizerOverview.today')
  if (d < 0) return t('organizerOverview.daysAgo', { count: Math.abs(d) })
  return t('organizerOverview.daysLeft', { count: d })
})

const typeLabel = computed(() => {
  const raw = props.event.categoryType
  return raw ? t(`eventCategories.${String(raw).toLowerCase()}`, raw) : ''
})

const statusKey = computed(() => String(props.event.status || 'draft').toLowerCase())
const statusLabel = computed(() =>
  t(`organizerOverview.status.${statusKey.value}`, props.event.status || ''))

const heroStyle = computed(() => {
  const key = props.event.heroImageUrl || props.event.invitation?.heroImageUrl
  return key
    ? { backgroundImage: `url("${key}")` }
    : {}
})
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.15s, transform 0.15s;
}

.card:hover { box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08); transform: translateY(-2px); }
.card--urgent { border-color: #e0b384; }

.hero {
  position: relative;
  height: 120px;
  background: linear-gradient(135deg, var(--brand) 0%, #86a37c 100%);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.6rem 0.7rem;
}

.hero-type, .hero-countdown {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
}

.hero-countdown.is-past { background: rgba(0, 0, 0, 0.3); font-weight: 400; }

.pin {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  border: 0;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: #666;
}

.pin--on { color: var(--brand); }

.body { padding: 0.75rem 0.85rem; display: flex; flex-direction: column; gap: 0.4rem; flex: 1; }
.name { margin: 0; font-size: 1rem; font-weight: 600; line-height: 1.25; }
.meta { margin: 0; font-size: 0.82rem; color: #777; }

.stats { display: flex; gap: 1.25rem; margin: 0.15rem 0 0; }
.stats dt { font-size: 0.7rem; color: #999; }
.stats dd { margin: 0; font-size: 0.95rem; font-weight: 600; }

.rsvp { height: 5px; border-radius: 999px; background: #eee; overflow: hidden; }
.rsvp-fill { height: 100%; background: var(--brand); }

.overdue { margin: 0; font-size: 0.8rem; color: #a05a1e; font-weight: 600; }

.actions { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: auto; padding-top: 0.5rem; }
.open { background: var(--brand); color: #fff; border: 0; border-radius: 6px; padding: 0.4rem 0.8rem; cursor: pointer; font-size: 0.85rem; }

.status { font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 4px; background: #eee; color: #666; }
.status--activated { background: #dceedd; color: #2f6b36; }
.status--draft { background: #f0f0f0; }
.status--completed { background: #e6ecf5; color: #3a5a86; }

.card--compact .body { padding: 0.6rem 0.7rem; }
.card--compact .name { font-size: 0.9rem; }
</style>
