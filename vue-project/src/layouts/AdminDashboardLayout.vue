<template>
  <DashShell>
    <template #side="{ close }">
      <AdminSidebarNav @close="close" />
    </template>

    <template #top="{ toggle }">
      <!-- The notification store is per-event and the admin console is not
           scoped to one, so the bell would be permanently empty here. -->
      <DashTopBar
        :current="current"
        :search-hint="t('dash.searchAdmin')"
        :show-notifications="false"
        @toggle="toggle"
      />
    </template>

    <router-view />
  </DashShell>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import DashShell from '@/components/dashboard/shell/DashShell.vue'
import DashTopBar from '@/components/dashboard/shell/DashTopBar.vue'
import AdminSidebarNav from '@/components/layout/AdminSidebarNav.vue'
import { adminSectionFor } from '@/components/layout/adminSections.js'

const { t } = useI18n()
const route = useRoute()

/** Each group of screens is a tab in the top bar, with its own sidebar (IVY-912). */
const current = computed(() => adminSectionFor(route.path).key)
</script>
