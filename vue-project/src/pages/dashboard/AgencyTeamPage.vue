<template>
  <div class="agency-team">
    <PageHead :title="t('agencyScreens.team.title')" :subtitle="t('agencyScreens.team.subtitle')">
      <template #actions>
        <RouterLink :to="dashboardLink" class="btn btn-ghost btn-sm back">{{ t('agencyTeam.backToDashboard') }}</RouterLink>
        <button type="button" class="btn btn-primary btn-sm" @click="invite">+ {{ t('agencyScreens.team.invite') }}</button>
      </template>
    </PageHead>

    <div class="kpis">
      <div class="kpi">
        <span>{{ t('agencyScreens.team.kpiMembers') }}</span>
        <strong>{{ members.length }}</strong>
        <small>{{ t('agencyScreens.team.kpiMembersNote') }}</small>
      </div>
      <div class="kpi">
        <span>{{ t('agencyScreens.team.kpiEvents') }}</span>
        <strong>{{ kpis.activeEvents ?? 0 }}</strong>
        <small>{{ t('agencyScreens.team.kpiEventsNote') }}</small>
      </div>
      <div :class="['kpi', { danger: (kpis.overdueTasks ?? 0) > 0 }]">
        <span>{{ t('agencyScreens.team.kpiOverdue') }}</span>
        <strong>{{ kpis.overdueTasks ?? 0 }}</strong>
        <small>{{ t('agencyScreens.team.kpiOverdueNote') }}</small>
      </div>
      <div class="kpi">
        <span>{{ t('agencyScreens.team.kpiUnassigned') }}</span>
        <strong>{{ unassigned }}</strong>
        <small>{{ unassigned ? t('agencyScreens.team.kpiUnassignedNote') : t('agencyScreens.team.kpiUnassignedNone') }}</small>
      </div>
    </div>

    <div class="section-line">
      <div>
        <h2>{{ t('agencyScreens.team.engagement') }}</h2>
        <p>{{ t('agencyScreens.team.engagementHint') }}</p>
      </div>
    </div>

    <!--
      Who is carrying what, from the same numbers the agency home shows. Drawn
      only when there is somebody to show: an empty table here would read as
      "no team" when it only means the workload could not be read, and the
      accounts below say who the team actually is either way.
    -->
    <section v-if="members.length" class="card engagement-card">
      <div class="engagement-wrap">
        <table class="engagement">
          <thead>
            <tr>
              <th>{{ t('agencyScreens.team.colMember') }}</th>
              <th>{{ t('agencyScreens.team.colRole') }}</th>
              <th>{{ t('agencyScreens.team.colEvents') }}</th>
              <th>{{ t('agencyScreens.team.colOverdue') }}</th>
              <th>{{ t('agencyScreens.team.colActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in members" :key="member.id">
              <td><b>{{ member.name || t('agencyWork.team.unknown') }}</b></td>
              <td>{{ roleOf(member) }}</td>
              <td>{{ t('agencyScreens.team.eventsCount', { n: member.activeEvents }) }}</td>
              <td><span :class="['pill', member.overdueTasks ? 'red' : 'green']">{{ member.overdueTasks }}</span></td>
              <td><RouterLink class="text-link" :to="privilegesLink">{{ t('agencyScreens.team.permissions') }} →</RouterLink></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <p v-else class="quiet-note">{{ t('agencyScreens.team.noWorkload') }}</p>

    <!--
      The accounts themselves: the same table and the same endpoints as the
      platform administrator's users screen, narrowed by the server to the
      organization in the caller's token (IVY-1203). Two roles rather than
      three — an agency hires organizers and adds client accounts; minting
      platform administrators, or a second owner, stays with the platform.
    -->
    <section class="accounts">
      <UserDirectory
        ref="directory"
        :title="t('agencyScreens.team.accounts')"
        :subtitle="t('agencyTeam.subtitle')"
        :role-options="ROLE_OPTIONS"
        :protected-roles="PROTECTED_ROLES"
        :default-roles="DEFAULT_ROLES"
      />
      <!--
        Said once, on the screen where it bites. An agency owner who tries to
        add a second owner gets a 400 from the server naming the role; being
        told beforehand is cheaper than being refused.
      -->
      <p class="note">{{ t('agencyTeam.roleNote') }}</p>
    </section>
  </div>
</template>

<script setup>
/**
 * The agency's team (2026 agency design, "Тим"; accounts since IVY-1203).
 *
 * <p>Two halves. Above, who is carrying the agency's events and how late their
 * work is — the workload the agency home already computes. Below, the
 * accounts, where the owner adds, edits and removes people; the header's
 * "invite" opens that same form.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import UserDirectory from '@/components/users/UserDirectory.vue'
import { agencyWorkspaceService } from '@/services/agencyWorkspace.service'

const ROLE_OPTIONS = ['AGENCY_MEMBER', 'USER']
const PROTECTED_ROLES = ['ADMIN', 'AGENCY']
const DEFAULT_ROLES = ['AGENCY_MEMBER']

const { t } = useI18n()
const route = useRoute()

const lang = computed(() => route.params.lang || 'mk')
const dashboardLink = computed(() => `/${lang.value}/agency/dashboard`)
const privilegesLink = computed(() => `/${lang.value}/agency/privileges`)

const directory = ref(null)
const home = ref(null)

const members = computed(() => home.value?.team?.members ?? [])
const unassigned = computed(() => home.value?.team?.unassignedOverdue ?? 0)
const kpis = computed(() => home.value?.kpis ?? {})

/** How many of the active events each person leads, from the same rows. */
const leadCounts = computed(() => {
  const counts = new Map()
  for (const row of home.value?.events ?? []) {
    const id = row.lead?.id
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
})

function roleOf(member) {
  const leads = leadCounts.value.get(member.id) ?? 0
  return leads
    ? t('agencyScreens.team.leadOf', { n: leads })
    : t('agencyScreens.team.teamMember')
}

function invite() {
  directory.value?.openCreate()
}

onMounted(async () => {
  try {
    const response = await agencyWorkspaceService.home()
    home.value = response?.data?.data ?? response?.data ?? null
  } catch {
    // The accounts table below is the page's job; a missing workload is not.
    home.value = null
  }
})
</script>

<style scoped src="../../components/agency/agency-panels.css"></style>

<style scoped>
/* `.kpis`, `.kpi` and `.card` are the design's, in `ivy/dash.css`. */
.kpi.danger strong {
  color: var(--rose-ink);
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

.engagement-card {
  padding: 0;
  overflow: hidden;
}

.engagement-wrap {
  overflow-x: auto;
}

.engagement {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  font-size: 14px;
}

.engagement th {
  padding: 12px 16px;
  background: var(--mist-2);
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
}

.engagement td {
  padding: 14px 16px;
  border-top: 1px solid var(--line);
}

.quiet-note {
  color: var(--ink-3);
  font-size: 13px;
}

.accounts {
  margin-top: 28px;
}

.note {
  margin-top: 1rem;
  font-size: 0.8125rem;
  color: var(--ink-3);
}
</style>
