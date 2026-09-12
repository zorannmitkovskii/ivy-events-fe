<template>
  <DashSide
    :context-label="t('agencySidebar.contextLabel')"
    :context-name="activeEventsLine"
    :plan="planLabel"
    :name="userName"
    :role="t('agencySidebar.role')"
    @close="$emit('close')"
  >
    <template #nav>
      <DashNavItem
        v-for="item in navItems"
        :key="item.key"
        :to="item.to"
        :label="t(item.labelKey)"
        :icon="item.icon"
        :count="item.count || 0"
        :active="isActive(item.match)"
      />
    </template>

    <template #account>
      <SidebarAccount
        @settings="goToSettings"
        @invitation-links="goToPipeline"
        @packages="goToEvents"
        @support="goToSupport"
        @sign-out="signOut"
      />
    </template>
  </DashSide>
</template>

<script setup>
/**
 * The agency console's own navigation (IVY-1401).
 *
 * <p>Until IVY-1401 the three agency screens sat outside every layout, so the
 * only way between them was a grid of tiles on the dashboard — navigation
 * dressed as content. An owner who opened the team screen had no way back
 * except the browser button.
 *
 * <p>Eight destinations now, which is what the 2026 design lists. The pipeline
 * appears as "Clients": it lives under the organizer routes but belongs to
 * whoever runs the agency, which is why it is reached from here rather than
 * from an event.
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DashSide from '@/components/dashboard/shell/DashSide.vue'
import DashNavItem from '@/components/dashboard/shell/DashNavItem.vue'
import SidebarAccount from '@/components/sidebar/SidebarAccount.vue'
import { DashIcons } from '@/utils/dashIcons.js'
import { getFullName, logout } from '@/services/auth.service'
import { crmService } from '@/services/crm.service'

defineEmits(['close'])

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const lang = computed(() => route.params.lang || 'mk')
const at = (path) => `/${lang.value}/${path}`

const navItems = computed(() => [
  { key: 'dashboard', to: at('org/dashboard'), match: '/org/dashboard', labelKey: 'agencySidebar.dashboard', icon: DashIcons.overview },
  { key: 'events', to: at('organizer'), match: '/organizer', labelKey: 'agencySidebar.myEvents', icon: DashIcons.calendar },
  { key: 'clients', to: at('org/pipeline'), match: '/org/pipeline', labelKey: 'agencySidebar.clients', icon: DashIcons.guests },
  { key: 'team', to: at('org/users'), match: '/org/users', labelKey: 'agencySidebar.team', icon: DashIcons.team },
  { key: 'tasks', to: at('org/tasks'), match: '/org/tasks', labelKey: 'agencySidebar.tasks', icon: DashIcons.tasks },
  { key: 'calendar', to: at('org/calendar'), match: '/org/calendar', labelKey: 'agencySidebar.calendar', icon: DashIcons.calendar },
  { key: 'vendors', to: at('org/vendors'), match: '/org/vendors', labelKey: 'agencySidebar.vendors', icon: DashIcons.vendors },
  { key: 'reports', to: at('org/reports'), match: '/org/reports', labelKey: 'agencySidebar.reports', icon: DashIcons.reports },
  // A ninth row the mockup does not draw. Its agency sidebar has no settings
  // because its admin one does; here branding, the plan and the at-risk window
  // are all behind this link, and a screen reachable only by typing its URL is
  // exactly what this sidebar was built to stop.
  { key: 'settings', to: at('org/settings'), match: '/org/settings', labelKey: 'agencySidebar.settings', icon: DashIcons.settings },
])

const isActive = (match) => String(route.path || '').includes(match)

const userName = computed(() => getFullName() || t('agencySidebar.role'))

/*
  The context card names the workspace. Ivy has no organization name to show —
  since IVY-101 the org lives in zm-organization-service and Ivy only reads the
  `orgId` claim — so the card carries what this console is actually scoped to:
  how many events are running, and on which plan.
*/
const plan = ref(null)

const activeEventsLine = computed(() =>
  plan.value ? t('agencySidebar.activeEvents', { n: plan.value.activeEventCount ?? 0 }) : '',
)

const planLabel = computed(() =>
  plan.value?.tier ? t('agencySidebar.planBadge', { tier: plan.value.tier }) : '',
)

onMounted(async () => {
  try {
    plan.value = await crmService.plan()
  } catch {
    // The card is skipped when there is nothing to put on it; navigation stays.
  }
})

function goToSettings() {
  router.push(at('org/settings'))
}
function goToPipeline() {
  router.push(at('org/pipeline'))
}
function goToEvents() {
  router.push(at('organizer'))
}
function goToSupport() {
  router.push(at('dashboard/events/support'))
}
function signOut() {
  logout()
  router.push(at('auth/login'))
}
</script>
