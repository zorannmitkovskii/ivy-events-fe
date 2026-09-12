<template>
  <DashShell>
    <template #side="{ close }">
      <DashSide
        :context-label="t('vendorPortal.contextLabel')"
        :context-name="vendorName"
        :plan="statusBadge"
        :name="vendorName || t('vendorPortal.contextLabel')"
        :role="t('vendorPortal.role')"
        @close="close"
      >
        <template #nav>
          <!-- A photographer has no room to lay out and a caterer has no
               showreel. The rows come from the backend's capability list, not
               from a copy of the vendor-type map kept here. -->
          <DashNavItem
            v-for="tab in tabs"
            :key="tab.name"
            :to="{ name: tab.name }"
            :label="t(tab.label)"
            :icon="icons[tab.name] || DashIcons.overview"
            :active="route.name === tab.name"
          />
        </template>

        <template #account>
          <button class="side-signout" type="button" @click="onLogout">
            {{ t('vendorPortal.logout') }}
          </button>
        </template>
      </DashSide>
    </template>

    <template #top="{ toggle }">
      <DashTopBar current="vendor" :search-hint="t('dash.searchVendor')" @toggle="toggle" />
    </template>

    <p v-if="notLinked" class="empty">{{ t('vendorPortal.notLinked') }}</p>
    <RouterView v-else />
  </DashShell>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DashShell from '@/components/dashboard/shell/DashShell.vue'
import DashSide from '@/components/dashboard/shell/DashSide.vue'
import DashNavItem from '@/components/dashboard/shell/DashNavItem.vue'
import DashTopBar from '@/components/dashboard/shell/DashTopBar.vue'
import { DashIcons } from '@/utils/dashIcons.js'
import { useVendorProfile } from '@/composables/useVendorProfile'
import { VENDOR_TABS } from '@/router/vendorTabs'
import { logout } from '@/services/auth.service'

/** One icon per tab, by route name — the tab list itself stays about routing. */
const icons = {
  'vendor.packages': DashIcons.budget,
  'vendor.floorPlans': DashIcons.seating,
  'vendor.portfolio': DashIcons.portfolio,
  'vendor.calendar': DashIcons.calendar,
  'vendor.inbox': DashIcons.messages,
  'vendor.application': DashIcons.tasks,
  'vendor.microsite': DashIcons.settings,
}

const { t } = useI18n()
const route = useRoute()
const { profile, notLinked, load, reset } = useVendorProfile()

const vendorName = computed(() => profile.value?.name ?? '')

/** APPROVED is the state worth showing; the others say so on the application. */
const statusBadge = computed(() =>
  profile.value?.status === 'APPROVED' ? t('vendorPortal.approved') : '',
)

const tabs = computed(() => {
  const capabilities = profile.value?.capabilities ?? []
  // A null capability means the tab is ungated — the inbox, the application
  // and the microsite belong to every vendor whatever their trade. Filtering
  // on `includes` alone dropped all three, because no capability list
  // contains null.
  return VENDOR_TABS.filter(
    (tab) => tab.capability === null || capabilities.includes(tab.capability),
  )
})

onMounted(load)

function onLogout() {
  reset()
  logout()
}
</script>

<style scoped>
/* The vendor sidebar's account row is a sign-out rather than a menu: the
   portal has no settings behind it — the application and the microsite are
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
