<template>
  <div class="dashboard-layout">
    <aside class="dash-sidebar" :class="{ open: drawerOpen }">
      <AgencySidebarNav @close="drawerOpen = false" />
    </aside>

    <div v-if="drawerOpen" class="backdrop" @click="drawerOpen = false"></div>

    <div class="main">
      <TopBar @toggle-menu="drawerOpen = !drawerOpen" :show-hamburger="true" />
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
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
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AgencySidebarNav from '@/components/layout/AgencySidebarNav.vue'
import TopBar from '@/components/layout/TopBar.vue'

const drawerOpen = ref(false)
const route = useRoute()

watch(() => route.path, () => {
  drawerOpen.value = false
})
</script>
