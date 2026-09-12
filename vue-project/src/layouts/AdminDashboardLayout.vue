<template>
  <DashShell>
    <template #side="{ close }">
      <AdminSidebarNav @close="close" />
    </template>

    <template #top="{ toggle }">
      <!-- The notification store is per-event and the admin console is not
           scoped to one, so the bell would be permanently empty here. -->
      <DashTopBar
        current="admin"
        :search-hint="t('dash.searchAdmin')"
        :show-notifications="false"
        @toggle="toggle"
      />
    </template>

    <router-view />
  </DashShell>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import DashShell from '@/components/dashboard/shell/DashShell.vue'
import DashTopBar from '@/components/dashboard/shell/DashTopBar.vue'
import AdminSidebarNav from '@/components/layout/AdminSidebarNav.vue'

const { t } = useI18n()
</script>
