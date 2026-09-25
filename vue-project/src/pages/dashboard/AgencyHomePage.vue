<template>
  <div class="agency-home">
    <PageHead
      :title="isOwner ? t('agencyWork.home.ownerTitle') : t('agencyWork.home.memberTitle')"
      :subtitle="isOwner ? t('agencyWork.home.ownerSubtitle') : t('agencyWork.home.memberSubtitle')"
    >
      <template #actions>
        <RouterLink v-if="isOwner" class="btn btn-primary btn-sm" :to="createEventLink">{{ t('dash.newEvent') }}</RouterLink>
        <RouterLink v-else class="btn btn-primary btn-sm" :to="`/${lang}/agency/tasks`">{{ t('agencyWork.newTask') }}</RouterLink>
      </template>
    </PageHead>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-else-if="loading && !home" class="loading">{{ t('common.loading') }}</p>

    <EmptyDashboard
      v-if="home && isEmpty"
      :title="isOwner ? t('emptyDashboard.title') : t('agencyWork.home.memberEmptyTitle')"
      :body="isOwner ? t('emptyDashboard.body') : t('agencyWork.home.memberEmptyBody')"
      :action="isOwner ? t('emptyDashboard.action') : ''"
      :to="isOwner ? createEventLink : ''"
    />

    <template v-if="home && !isEmpty">
      <!-- The four the Agency-Organizer design asks for, per role. Each leads to
           where its number comes from. -->
      <div class="kpis">
        <RouterLink :to="`/${lang}/agency/events`" class="kpi">
          <span>{{ isOwner ? t('agencyWork.kpi.inProgress') : t('agencyWork.kpi.myEvents') }}</span>
          <strong>{{ home.kpis.activeEvents }}</strong>
          <small>{{ isOwner ? t('agencyWork.kpi.nextDays', { n: home.kpis.activeEventsSoon, days: home.riskWindowDays }) : t('agencyWork.kpi.leadOrAssistant') }}</small>
        </RouterLink>

        <RouterLink :to="`/${lang}/agency/calendar`" class="kpi">
          <span>{{ t('agencyWork.kpi.soon', { days: home.riskWindowDays }) }}</span>
          <strong>{{ home.kpis.activeEventsSoon }}</strong>
          <small>{{ soonNote }}</small>
        </RouterLink>

        <RouterLink :to="`/${lang}/agency/tasks`" :class="['kpi', { danger: overdueFigure > 0 }]">
          <span>{{ isOwner ? t('agencyWork.kpi.overdue') : t('agencyWork.kpi.myOverdue') }}</span>
          <strong>{{ overdueFigure }}</strong>
          <small>{{ overdueNote }}</small>
        </RouterLink>

        <RouterLink v-if="isOwner" :to="`/${lang}/agency/events`" :class="['kpi', { warn: home.kpis.overBudgetEvents > 0 }]">
          <span>{{ t('agencyWork.kpi.overBudget') }}</span>
          <strong>{{ home.kpis.overBudgetEvents ?? 0 }}</strong>
          <small>{{ t('agencyWork.kpi.overBudgetNote') }}</small>
        </RouterLink>
        <button v-else type="button" :class="['kpi', { warn: home.kpis.awaitingRsvp > 0 }]" @click="scrollTo('agency-awaiting')">
          <span>{{ t('agencyWork.kpi.noRsvp') }}</span>
          <strong>{{ home.kpis.awaitingRsvp }}</strong>
          <small>{{ awaitingNote }}</small>
        </button>
      </div>

      <div class="section-line">
        <div>
          <h2>{{ isOwner ? t('agencyWork.home.attentionTitle') : t('agencyWork.home.priorityTitle') }}</h2>
          <p>{{ t('agencyWork.home.attentionLine') }}</p>
        </div>
        <RouterLink :to="`/${lang}/agency/tasks`">{{ t('agencyWork.home.allTasks') }} →</RouterLink>
      </div>

      <div class="two-col">
        <AgencyAttentionPanel :items="home.attention" :events="home.events" />
        <AgencyDeadlinesPanel v-model:range="range" :items="home.deadlines" :today="home.today" />
      </div>

      <div class="section-line">
        <div>
          <h2 id="agency-active-events">{{ t('agencyWork.home.upcomingEvents') }}</h2>
          <p>{{ t('agencyWork.home.upcomingEventsHint') }}</p>
        </div>
        <RouterLink :to="`/${lang}/agency/events`">{{ t('agencyWork.home.openEvents') }} →</RouterLink>
      </div>

      <section class="card events-card" aria-labelledby="agency-active-events">
        <AgencyEventsTable :rows="home.events" :is-owner="isOwner" :risk-window-days="home.riskWindowDays" />
      </section>

      <div class="lower">
        <AgencyTeamPanel v-if="isOwner && home.team" :team="home.team" />
        <AgencyNextSteps v-else :rows="home.events" />
        <AgencyVendorDecisions :decisions="home.vendorDecisions" />
        <AgencyBudgetPanel v-if="isOwner && home.budget" :budget="home.budget" />
        <AgencyAwaitingGuests v-else :rows="home.events" />
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * The agency home (2026 design, "Табла на агенцијата").
 *
 * <p>One page for both people who work in the agency, drawn from one request.
 * The owner's version answers "what needs the agency today": every active
 * event, who is carrying it, the team's load and the money. A member's answers
 * "what needs me today": the events they are on, the overdue work that is
 * theirs, their next step on each — and nothing about colleagues' workloads or
 * the budgets, which the server does not send them in the first place.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import EmptyDashboard from '@/components/dashboard/EmptyDashboard.vue'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import AgencyAttentionPanel from '@/components/agency/AgencyAttentionPanel.vue'
import AgencyDeadlinesPanel from '@/components/agency/AgencyDeadlinesPanel.vue'
import AgencyEventsTable from '@/components/agency/AgencyEventsTable.vue'
import AgencyTeamPanel from '@/components/agency/AgencyTeamPanel.vue'
import AgencyNextSteps from '@/components/agency/AgencyNextSteps.vue'
import AgencyVendorDecisions from '@/components/agency/AgencyVendorDecisions.vue'
import AgencyBudgetPanel from '@/components/agency/AgencyBudgetPanel.vue'
import AgencyAwaitingGuests from '@/components/agency/AgencyAwaitingGuests.vue'
import { agencyWorkspaceService } from '@/services/agencyWorkspace.service'
import { getErrorMessage } from '@/services/apiError'
import { useAgencyRole } from '@/composables/useAgencyRole'

const { t } = useI18n()
const route = useRoute()
const { isOwner } = useAgencyRole()

const lang = computed(() => route.params.lang || 'mk')
const createEventLink = computed(() => `/${lang.value}/event-category`)

const home = ref(null)
const range = ref(7)
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await agencyWorkspaceService.home(range.value)
    home.value = response?.data?.data ?? response?.data ?? null
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(range, load)

/** A brand-new agency, or a member not yet put on anything. */
const isEmpty = computed(() => home.value && !home.value.events.length && !home.value.deadlines.length)

const overdueFigure = computed(() =>
  isOwner.value ? home.value.kpis.overdueTasks : home.value.kpis.myOverdueTasks ?? 0,
)

/** "10 Ивана · 5 Маја · 0 без одговорен" — the owner's split of the same number. */
const overdueNote = computed(() => {
  if (!isOwner.value) return t('agencyWork.kpi.myOverdueNote', { n: home.value.kpis.overdueTasks })
  const team = home.value.team
  if (!team) return ''
  const people = team.members
    .filter((member) => member.overdueTasks > 0)
    .map((member) => `${member.overdueTasks} ${firstName(member.name)}`)
  return [...people, t('agencyWork.kpi.unassignedCount', { n: team.unassignedOverdue })].join(' · ')
})

/** "16 за Марија & Филип" — where most of the unanswered invitations are. */
const awaitingNote = computed(() => {
  const worst = [...home.value.events].sort((a, b) => b.awaitingCount - a.awaitingCount)[0]
  return worst?.awaitingCount ? t('agencyWork.kpi.awaitingMost', { n: worst.awaitingCount, name: worst.name }) : ''
})

/** The nearest event inside the agency's risk window, by name — the design's note under "next N days". */
const soonNote = computed(() => {
  const nearest = home.value.events.find((row) => row.daysUntil != null && row.daysUntil <= home.value.riskWindowDays)
  return nearest ? nearest.name : t('agencyWork.kpi.nothingSoon')
})

function firstName(fullName) {
  return (fullName || '').split(' ')[0] || ''
}

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<style scoped>
/* `.kpis`, `.kpi`, `.card` and `.card-head` are the design's, in `ivy/dash.css`. */
.kpi {
  border: 1px solid var(--line);
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}

.kpi:hover {
  transform: translateY(-2px);
  border-color: var(--moss);
  text-decoration: none;
}

.kpi.danger strong {
  color: var(--rose-ink);
}

.kpi.warn strong {
  color: var(--gold-deep);
}

.two-col {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.85fr);
  gap: 16px;
  margin-bottom: 16px;
}

.events-card {
  margin-bottom: 16px;
  padding: 6px 18px;
}

.section-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin: 24px 0 12px;
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

.lede {
  margin-top: 4px;
  color: var(--ink-3);
  font-size: 13px;
}

.lower {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.error {
  color: var(--rose-ink);
}

.loading {
  color: var(--ink-3);
}

@media (max-width: 1180px) {
  .lower {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .two-col,
  .lower {
    grid-template-columns: 1fr;
  }
}
</style>
