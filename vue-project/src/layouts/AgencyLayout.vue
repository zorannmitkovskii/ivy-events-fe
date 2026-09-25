<template>
  <DashShell>
    <template #side="{ close }">
      <AgencySidebarNav @close="close" />
    </template>

    <template #top="{ toggle }">
      <!-- No quick action here: the Agency-Organizer design puts "new event" /
           "new task" in the page heading of the screens it belongs to, and a
           second copy in the bar read as two different buttons. -->
      <DashTopBar current="agency" workspace-notifications @toggle="toggle">
        <template #search>
          <WorkspaceSearch :search="search" :placeholder="t('dash.searchAgency')" @select="open" />
        </template>
      </DashTopBar>
    </template>

    <router-view />
  </DashShell>
</template>

<script setup>
/**
 * The agency console shell (IVY-1401).
 *
 * <p>The agency screens were the only signed-in area without one. That is what
 * made the dashboard's tile grid load-bearing: with no sidebar, the tiles were
 * the navigation, and the redesign's claim that they duplicated it was simply
 * wrong. With a shell they are free to go.
 */
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import DashShell from '@/components/dashboard/shell/DashShell.vue'
import DashTopBar from '@/components/dashboard/shell/DashTopBar.vue'
import WorkspaceSearch from '@/components/dashboard/shell/WorkspaceSearch.vue'
import AgencySidebarNav from '@/components/layout/AgencySidebarNav.vue'
import { selectEvent } from '@/services/eventSelection.service'
import { unwrapHits, workspaceSearchService } from '@/services/workspaceSearch.service'
import { agencyRouteFor } from '@/utils/workspaceSearchRoutes.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

async function search(q) {
  return unwrapHits(await workspaceSearchService.agency(q))
}

/** An event is selected before it is opened — the event workspace reads it from the store, not the URL. */
function open(hit) {
  const target = agencyRouteFor(hit, route.params.lang || 'mk')
  if (!target) return
  if (hit.kind === 'EVENT') {
    selectEvent({ id: hit.eventId || hit.id, categoryType: hit.categoryType, status: hit.status })
  }
  router.push(target)
}
</script>
