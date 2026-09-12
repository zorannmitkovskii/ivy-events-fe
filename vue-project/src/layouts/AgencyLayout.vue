<template>
  <DashShell>
    <template #side="{ close }">
      <AgencySidebarNav @close="close" />
    </template>

    <template #top="{ toggle }">
      <DashTopBar current="organizer" :search-hint="t('dash.searchAgency')" @toggle="toggle">
        <template #action>
          <router-link class="btn btn-primary btn-sm" :to="{ name: 'EventCategoryPage', params: { lang } }">
            {{ t('dash.newEvent') }}
          </router-link>
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DashShell from '@/components/dashboard/shell/DashShell.vue'
import DashTopBar from '@/components/dashboard/shell/DashTopBar.vue'
import AgencySidebarNav from '@/components/layout/AgencySidebarNav.vue'

const { t } = useI18n()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')
</script>
