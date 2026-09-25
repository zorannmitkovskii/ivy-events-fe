<template>
  <DashShell>
    <template #side="{ close }">
      <DashSide
        :context-label="contextLabel"
        :context-name="vendorName"
        :plan="statusBadge"
        :name="vendorName || t('vendorPortal.contextLabel')"
        :role="t('vendorPortal.role')"
        @close="close"
      >
        <template #nav>
          <!-- A photographer has no room to lay out and a caterer has no
               showreel. The rows come from the backend's capability list, not
               from a copy of the vendor-type map kept here. Grouped under the
               2026 design's three captions. -->
          <template v-for="group in groups" :key="group.key">
            <p class="snav-caption">{{ t(`vendorWork.nav.groups.${group.key}`) }}</p>
            <DashNavItem
              v-for="tab in group.tabs"
              :key="tab.name"
              :to="{ name: tab.name }"
              :label="t(tab.label)"
              :icon="icons[tab.name] || DashIcons.overview"
              :count="tab.name === 'vendor.inbox' ? newInquiries : 0"
              :active="isActive(tab.name)"
            />
          </template>
        </template>

        <template #account>
          <button class="side-signout" type="button" @click="onLogout">
            {{ t('vendorPortal.logout') }}
          </button>
        </template>
      </DashSide>
    </template>

    <template #top="{ toggle }">
      <DashTopBar current="vendor" workspace-notifications @toggle="toggle">
        <template #search>
          <WorkspaceSearch :search="search" :placeholder="t('dash.searchVendor')" @select="openHit" />
        </template>
        <template #action>
          <RouterLink v-if="profile?.slug" class="btn btn-ghost btn-sm" :to="{ name: 'vendor.microsite.preview' }">
            {{ t('vendorWork.openMicrosite') }}
          </RouterLink>
        </template>
      </DashTopBar>
    </template>

    <p v-if="notLinked" class="empty">{{ t('vendorPortal.notLinked') }}</p>
    <RouterView v-else />
  </DashShell>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePrivileges } from '@/composables/usePrivileges'
import DashShell from '@/components/dashboard/shell/DashShell.vue'
import DashSide from '@/components/dashboard/shell/DashSide.vue'
import DashNavItem from '@/components/dashboard/shell/DashNavItem.vue'
import DashTopBar from '@/components/dashboard/shell/DashTopBar.vue'
import WorkspaceSearch from '@/components/dashboard/shell/WorkspaceSearch.vue'
import { unwrapHits, workspaceSearchService } from '@/services/workspaceSearch.service'
import { vendorRouteFor } from '@/utils/workspaceSearchRoutes.js'
import { DashIcons } from '@/utils/dashIcons.js'
import { useVendorProfile } from '@/composables/useVendorProfile'
import { VENDOR_GROUPS, VENDOR_TABS } from '@/router/vendorTabs'
import { unwrap, vendorWorkspaceService } from '@/services/vendorWorkspace.service'
import { logout } from '@/services/auth.service'

/** One icon per tab, by route name — the tab list itself stays about routing. */
const icons = {
  'vendor.home': DashIcons.overview,
  'vendor.inbox': DashIcons.messages,
  'vendor.calendar': DashIcons.calendar,
  'vendor.portfolio': DashIcons.portfolio,
  'vendor.packages': DashIcons.budget,
  'vendor.profile': DashIcons.guests,
  'vendor.microsite': DashIcons.link,
  'vendor.team': DashIcons.team,
  'vendor.insights': DashIcons.reports,
}

/** Screens opened from inside another one light up the row they belong to. */
const PARENT = { 'vendor.application': 'vendor.profile', 'vendor.privileges': 'vendor.team' }

const { t } = useI18n()
const { filterNav, load: loadPrivileges } = usePrivileges()
const route = useRoute()
const router = useRouter()
const { profile, notLinked, load, reset } = useVendorProfile()

const vendorName = computed(() => profile.value?.name ?? '')

/** "Vendor · photography", as the design's workspace card says it. */
const contextLabel = computed(() => {
  const type = profile.value?.type
  if (!type) return t('vendorPortal.contextLabel')
  const key = `vendorType.${type}`
  const label = t(key)
  return `${t('vendorPortal.contextLabel')} · ${label === key ? type.toLowerCase() : label.toLowerCase()}`
})

/** APPROVED is the state worth showing; the others say so on the profile. */
const statusBadge = computed(() =>
  profile.value?.approvalStatus === 'APPROVED' ? t('vendorPortal.approved') : '',
)

const tabs = computed(() => {
  const capabilities = profile.value?.capabilities ?? []
  // A null capability means the tab is ungated — the home, the inbox, the
  // profile and the microsite belong to every vendor whatever their trade.
  // Filtering on `includes` alone dropped all of them, because no capability
  // list contains null.
  const forThisTrade = VENDOR_TABS.filter(
    (tab) => tab.nav !== false && (tab.capability === null || capabilities.includes(tab.capability)),
  )
  // And then what this member may open, which is the owner's decision
  // rather than the trade's.
  return filterNav(forThisTrade)
})

/** The design's three captions, each with only the rows this vendor has. */
const groups = computed(() =>
  VENDOR_GROUPS
    .map((key) => ({ key, tabs: tabs.value.filter((tab) => tab.group === key) }))
    .filter((group) => group.tabs.length),
)

const isActive = (name) => route.name === name || PARENT[route.name] === name

/** New inquiries, for the badge on the inbox row. A count that fails to load is simply not drawn. */
const newInquiries = ref(0)

async function loadInquiryCount() {
  try {
    newInquiries.value = unwrap(await vendorWorkspaceService.metrics())?.byWorkflow?.NEW ?? 0
  } catch {
    newInquiries.value = 0
  }
}

// Answering in the inbox changes the count; re-read it when leaving there.
watch(() => route.name, (name, previous) => {
  if (previous === 'vendor.inbox' || name === 'vendor.home') loadInquiryCount()
})

onMounted(() => {
  loadPrivileges()
  load()
  loadInquiryCount()
})

async function search(q) {
  return unwrapHits(await workspaceSearchService.vendor(q))
}

function openHit(hit) {
  const target = vendorRouteFor(hit, route.params.lang || 'mk')
  if (target) router.push(target)
}

function onLogout() {
  reset()
  logout()
}
</script>

<style scoped>
/* The design groups the rows under small uppercase captions. */
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

/* The vendor sidebar's account row is a sign-out rather than a menu: the
   portal has no settings behind it — the profile and the microsite are
   both rows in the navigation above. */
.side-signout {
  flex: none;
  margin-left: auto;
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  font-size: 12.5px;
  white-space: nowrap;
  color: #c9d6ce;
}

.side-signout:hover {
  border-color: #fff;
  color: #fff;
}
</style>
