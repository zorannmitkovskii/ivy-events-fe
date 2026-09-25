<template>
  <div class="vendor-home">
    <PageHead :title="t('vendorWork.home.title')" :subtitle="t('vendorWork.home.subtitle')">
      <template #actions>
        <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'vendor.inbox' }">{{ t('vendorWork.home.seeInquiries') }}</RouterLink>
      </template>
    </PageHead>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-else-if="!home" class="muted">{{ t('common.loading') }}</p>

    <template v-else>
      <div class="kpis">
        <RouterLink class="kpi" :to="{ name: 'vendor.inbox', query: { workflow: 'NEW' } }">
          <span>{{ t('vendorWork.kpi.newInquiries') }}</span>
          <strong>{{ home.kpis.newInquiries }}</strong>
          <small>{{ t('vendorWork.kpi.newInquiriesNote') }}</small>
        </RouterLink>
        <RouterLink :class="['kpi', { danger: home.kpis.awaitingReply > 0 }]" :to="{ name: 'vendor.inbox' }">
          <span>{{ t('vendorWork.kpi.awaitingReply') }}</span>
          <strong>{{ home.kpis.awaitingReply }}</strong>
          <small>{{ t('vendorWork.kpi.awaitingReplyNote') }}</small>
        </RouterLink>
        <RouterLink class="kpi" :to="{ name: 'vendor.calendar' }">
          <span>{{ t('vendorWork.kpi.upcoming') }}</span>
          <strong>{{ home.kpis.upcomingEngagements }}</strong>
          <small>{{ t('vendorWork.kpi.upcomingNote') }}</small>
        </RouterLink>
        <RouterLink class="kpi" :to="{ name: 'vendor.microsite' }">
          <span>{{ t('vendorWork.kpi.microsite') }}</span>
          <strong>{{ home.kpis.micrositePublished ? t('vendorWork.microsite.live') : t('vendorWork.microsite.draft') }}</strong>
          <small>{{ home.kpis.micrositePublished ? t('vendorWork.kpi.micrositeLiveNote') : t('vendorWork.kpi.micrositeDraftNote') }}</small>
        </RouterLink>
      </div>

      <div class="section-line">
        <div>
          <h2>{{ t('vendorWork.home.attention') }}</h2>
          <p>{{ t('vendorWork.home.attentionHint') }}</p>
        </div>
        <RouterLink :to="{ name: 'vendor.inbox' }">{{ t('vendorWork.home.openInquiries') }} →</RouterLink>
      </div>

      <div class="two-col">
        <section class="card" aria-labelledby="vendor-activities">
          <h3 id="vendor-activities">{{ t('vendorWork.home.activities') }}</h3>
          <p class="lede">{{ t('vendorWork.home.activitiesHint') }}</p>
          <ul v-if="home.activities.length" class="lines">
            <li v-for="(activity, index) in home.activities" :key="`${activity.kind}-${index}`" class="line">
              <RouterLink class="activity" :to="linkFor(activity)">
                <b>{{ activityTitle(activity) }}</b>
                <small>{{ activitySubline(activity) }}</small>
              </RouterLink>
              <span :class="['pill', TONE[activity.kind]]">{{ t(`vendorWork.activity.tag.${activity.kind}`) }}</span>
            </li>
          </ul>
          <p v-else class="empty">{{ t('vendorWork.home.noActivities') }}</p>
        </section>

        <section class="card" aria-labelledby="vendor-readiness">
          <h3 id="vendor-readiness">{{ t('vendorWork.readiness.title') }}</h3>
          <p class="lede">{{ t('vendorWork.readiness.hint') }}</p>
          <ReadinessMeter :readiness="home.readiness" :approval-status="home.vendor.approvalStatus" />
          <RouterLink class="text-link" :to="{ name: 'vendor.profile' }">{{ t('vendorWork.readiness.continue') }} →</RouterLink>
        </section>
      </div>

      <div class="section-line">
        <div>
          <h2>{{ t('vendorWork.home.upcoming') }}</h2>
          <p>{{ t('vendorWork.home.upcomingHint') }}</p>
        </div>
        <RouterLink :to="{ name: 'vendor.calendar' }">{{ t('vendorWork.home.seeCalendar') }} →</RouterLink>
      </div>

      <section class="card">
        <ul v-if="home.upcoming.length" class="lines">
          <li v-for="booking in home.upcoming" :key="booking.bookingId" class="line">
            <div>
              <b>{{ formatDay(booking.startsAt, locale) }} · {{ booking.title || booking.eventName || t('vendorPortal.untitled') }}</b>
              <small v-if="booking.eventName && booking.title">{{ booking.eventName }}</small>
            </div>
            <span :class="['pill', booking.status === 'CONFIRMED' ? 'green' : 'amber']">
              {{ t(`vendorWork.booking.${booking.status}`) }}
            </span>
          </li>
        </ul>
        <p v-else class="empty">{{ t('vendorWork.home.noUpcoming') }}</p>
      </section>
    </template>
  </div>
</template>

<script setup>
/**
 * The vendor studio's home (2026 vendor design, "Контролна табла").
 *
 * <p>The inquiries that lead to a booking come first — new, then in
 * conversation — then the dates already held, then whatever is keeping the
 * profile or the microsite from bringing in more. One request fills it.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import ReadinessMeter from '@/components/vendor/ReadinessMeter.vue'
import { unwrap, vendorWorkspaceService } from '@/services/vendorWorkspace.service'
import { getErrorMessage } from '@/services/apiError'
import { formatDay } from '@/utils/agencyFormat.js'

const TONE = {
  INQUIRY_NEW: 'red',
  INQUIRY_IN_CONVERSATION: 'amber',
  BOOKING_HELD: 'amber',
  PROFILE_INCOMPLETE: 'slate',
  MICROSITE_DRAFT: 'slate',
  PORTFOLIO_EMPTY: 'slate',
}

/** Where each activity is dealt with. */
const DESTINATION = {
  INQUIRY_NEW: 'vendor.inbox',
  INQUIRY_IN_CONVERSATION: 'vendor.inbox',
  BOOKING_HELD: 'vendor.calendar',
  PROFILE_INCOMPLETE: 'vendor.profile',
  MICROSITE_DRAFT: 'vendor.microsite',
  PORTFOLIO_EMPTY: 'vendor.portfolio',
}

const { t, locale } = useI18n()

const home = ref(null)
const error = ref('')

onMounted(async () => {
  try {
    home.value = unwrap(await vendorWorkspaceService.home())
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
})

const localeCode = computed(() => locale.value)

function linkFor(activity) {
  const name = DESTINATION[activity.kind] || 'vendor.home'
  return activity.inquiryId ? { name, query: { inquiry: activity.inquiryId } } : { name }
}

function activityTitle(activity) {
  return t(`vendorWork.activity.title.${activity.kind}`, { name: activity.name || '' })
}

function activitySubline(activity) {
  const date = activity.date ? formatDay(activity.date, localeCode.value) : ''
  return t(`vendorWork.activity.sub.${activity.kind}`, { date })
}
</script>

<style scoped src="../../components/agency/agency-panels.css"></style>

<style scoped>
/* `.kpis`, `.kpi` and `.card` are the design's, in `ivy/dash.css`. */
.kpi {
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s, border-color 0.15s;
}

.kpi:hover {
  transform: translateY(-2px);
  border-color: var(--moss);
}

.kpi.danger strong {
  color: var(--rose-ink);
}

.section-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin: 26px 0 12px;
}

.section-line h2 {
  margin: 0;
  font-size: 22px;
}

.section-line p {
  margin: 3px 0 0;
  color: var(--ink-3);
  font-size: 13px;
}

.section-line a {
  color: var(--ivy);
  font-size: 13.5px;
  font-weight: 700;
  white-space: nowrap;
}

.two-col {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.85fr);
  gap: 16px;
}

.card h3 {
  margin: 0 0 4px;
  font-size: 19px;
}

.lede {
  margin-bottom: 10px;
}

.activity {
  display: block;
  color: inherit;
  text-decoration: none;
  min-width: 0;
}

.activity:hover b {
  text-decoration: underline;
}

.text-link {
  display: inline-block;
  margin-top: 10px;
}

.error {
  color: var(--rose-ink);
}

.muted {
  color: var(--ink-3);
}

@media (max-width: 1000px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
