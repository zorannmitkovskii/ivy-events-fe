<template>
  <DashSide
    :context-label="t('agencySidebar.contextLabel')"
    :context-name="activeEventsLine"
    :plan="planLabel"
    :name="userName"
    :role="isOwner ? t('agencySidebar.ownerRole') : t('agencySidebar.memberRole')"
    @close="$emit('close')"
  >
    <template #nav>
      <template v-for="group in groups" :key="group.key">
        <p class="snav-caption">{{ t(group.labelKey) }}</p>
        <template v-for="item in group.items" :key="item.key">
          <DashNavItem
            :to="item.to"
            :label="t(item.labelKey)"
            :icon="item.icon"
            :count="item.key === 'tasks' ? overdueCount : 0"
            :active="isActive(item)"
          />
        </template>
      </template>
    </template>

    <template #account>
      <SidebarAccount
        @settings="goTo('agency/settings')"
        @invitation-links="goTo('agency/pipeline')"
        @packages="goTo('agency/events')"
        @support="goTo('dashboard/events/support')"
        @sign-out="signOut"
      />
    </template>
  </DashSide>
</template>

<script setup>
/**
 * The agency console's navigation, drawn for the person using it.
 *
 * <p>Two sidebars, as the 2026 design has them. The owner's is the agency's:
 * everything it runs, grouped by what the job is (overview, operations,
 * management). A member's is their own work — their overview, their events,
 * their calendar, their tasks — plus the vendor directory everybody books from.
 *
 * <p>An owner's rows are still filtered by privilege, as before. A member's
 * own rows are not: they are that person's work and no privilege grants or
 * withholds it. What a privilege adds for a member is an owner screen, under
 * "Resources" — but only the screens a member can actually open. Team,
 * reports and settings are the owner's on the server whatever a privilege
 * row says, and a link that opens onto a refusal is worse than no link.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DashSide from '@/components/dashboard/shell/DashSide.vue'
import DashNavItem from '@/components/dashboard/shell/DashNavItem.vue'
import SidebarAccount from '@/components/sidebar/SidebarAccount.vue'
import { DashIcons } from '@/utils/dashIcons.js'
import { getFullName, getUserId, logout } from '@/services/auth.service'
import { crmService } from '@/services/crm.service'
import { usePrivileges } from '@/composables/usePrivileges'
import { useAgencyRole } from '@/composables/useAgencyRole'
import { agencyWorkspaceService } from '@/services/agencyWorkspace.service'

defineEmits(['close'])

/** Owner screens a member can open when granted the privilege. */
const MEMBER_GRANTABLE = new Set(['agency:crm'])

const { t } = useI18n()
const { can, load: loadPrivileges } = usePrivileges()
const { isOwner } = useAgencyRole()
const route = useRoute()
const router = useRouter()

const lang = computed(() => route.params.lang || 'mk')
const at = (path) => `/${lang.value}/${path}`

const item = (key, path, labelKey, icon, extra = {}) => ({
  key,
  to: at(path),
  match: `/${path}`,
  labelKey,
  icon,
  ...extra,
})

const ownerGroups = computed(() => [
  {
    key: 'main',
    labelKey: 'agencySidebar.groups.main',
    items: [
      item('dashboard', 'agency/dashboard', 'agencySidebar.dashboard', DashIcons.overview, { privilege: 'agency:dashboard' }),
      item('events', 'agency/events', 'agencySidebar.allEvents', DashIcons.calendar, { privilege: 'agency:events' }),
      item('calendar', 'agency/calendar', 'agencySidebar.centralCalendar', DashIcons.agenda, { privilege: 'agency:calendar' }),
    ],
  },
  {
    key: 'operations',
    labelKey: 'agencySidebar.groups.operations',
    items: [
      item('tasks', 'agency/tasks', 'agencySidebar.tasks', DashIcons.tasks, { privilege: 'agency:tasks' }),
      item('clients', 'agency/pipeline', 'agencySidebar.clients', DashIcons.guests, { privilege: 'agency:crm' }),
      item('vendors', 'agency/vendors', 'agencySidebar.vendors', DashIcons.vendors, { privilege: 'agency:vendors' }),
    ],
  },
  {
    key: 'management',
    labelKey: 'agencySidebar.groups.management',
    items: [
      item('team', 'agency/users', 'agencySidebar.team', DashIcons.team, { privilege: 'agency:team' }),
      item('privileges', 'agency/privileges', 'agencySidebar.teamPermissions', DashIcons.settings, { privilege: 'agency:team' }),
      item('reports', 'agency/reports', 'agencySidebar.reports', DashIcons.reports, { privilege: 'agency:reports' }),
      // The agency's public site. Gated like settings: what the agency says
      // about itself in public is the owner's call, and the server agrees.
      item('site', 'agency/site', 'agencySidebar.site', DashIcons.link, { privilege: 'agency:settings' }),
      item('settings', 'agency/settings', 'agencySidebar.settings', DashIcons.settings, { privilege: 'agency:settings' }),
    ],
  },
])

const memberGroups = computed(() => {
  const granted = ownerGroups.value
    .flatMap((group) => group.items)
    .filter((entry) => MEMBER_GRANTABLE.has(entry.privilege) && can(entry.privilege))
  return [
    {
      key: 'myWork',
      labelKey: 'agencySidebar.groups.myWork',
      items: [
        item('dashboard', 'agency/dashboard', 'agencySidebar.myOverview', DashIcons.overview),
        item('events', 'agency/events', 'agencySidebar.myEvents', DashIcons.calendar),
        item('calendar', 'agency/calendar', 'agencySidebar.myCalendar', DashIcons.agenda),
        item('tasks', 'agency/tasks', 'agencySidebar.myTasks', DashIcons.tasks),
      ],
    },
    {
      key: 'resources',
      labelKey: 'agencySidebar.groups.resources',
      items: [item('vendors', 'agency/vendors', 'agencySidebar.vendorDirectory', DashIcons.vendors), ...granted],
    },
  ]
})

/** Groups with nothing left in them after filtering are dropped, caption and all. */
const groups = computed(() => {
  if (!isOwner.value) return memberGroups.value
  return ownerGroups.value
    .map((group) => ({ ...group, items: group.items.filter((entry) => !entry.privilege || can(entry.privilege)) }))
    .filter((group) => group.items.length)
})

function isActive(entry) {
  return String(route.path || '').includes(entry.match)
}

const userName = computed(() => getFullName() || t('agencySidebar.role'))

/*
  The context card names the workspace. Ivy has no organization name to show —
  since IVY-101 the org lives in zm-organization-service and Ivy only reads the
  `orgId` claim — so the card carries what this console is actually scoped to:
  how many events are running, and on which plan.
*/
const plan = ref(null)

const activeEventsLine = computed(() =>
  plan.value ? t('agencySidebar.activeEvents', { n: plan.value.activeEvents ?? 0 }) : '',
)

/** The tier by its name in the page's language; an unknown tier shows as the server sent it. */
const planLabel = computed(() => {
  const tier = plan.value?.tier
  if (!tier) return ''
  const key = `agencySidebar.tiers.${tier}`
  const label = t(key)
  return t('agencySidebar.planBadge', { tier: label === key ? tier : label })
})

/**
 * Overdue work for the tasks row, counted from the same answer and by the same
 * rule the task screen opens with: every overdue task for an owner, the
 * member's own for a member. Read from the home before, which counted active
 * events only, so the badge and the screen could disagree by a draft's tasks.
 */
const overdueCount = ref(0)

async function loadOverdueCount() {
  try {
    const response = await agencyWorkspaceService.tasks()
    const tasks = (response?.data?.data ?? response?.data)?.tasks ?? []
    const myId = getUserId()
    overdueCount.value = tasks.filter((task) => task.overdue && (isOwner.value || task.assignee?.id === myId)).length
  } catch {
    overdueCount.value = 0
  }
}

// Dragging a card to "done" changes the count; re-read it when leaving the board.
watch(() => route.path, (path, previous) => {
  if (String(previous).includes('/agency/tasks')) loadOverdueCount()
})

onMounted(async () => {
  loadPrivileges()
  loadOverdueCount()
  try {
    // Wrapped like every other CRM read — the plan is the envelope's data.
    const response = await crmService.plan()
    plan.value = response?.data ?? response ?? null
  } catch {
    // The card is skipped when there is nothing to put on it; navigation stays.
  }
})

function goTo(path) {
  router.push(at(path))
}

function signOut() {
  logout()
  router.push(at('auth/login'))
}
</script>

<style scoped>
/* The design groups the rows under small uppercase captions. `.snav` is a
   flex column in `ivy/dash.css`; these sit in it as plain rows. */
.snav-caption {
  margin: 14px 12px 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8fa398;
}

.snav-caption:first-child {
  margin-top: 0;
}

</style>
