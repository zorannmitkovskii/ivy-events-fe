<template>
  <div class="dashboard-layout">
    <aside class="dash-sidebar" :class="{ open: drawerOpen }">
      <AdminSidebarNav @close="drawerOpen = false" />
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
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import AdminSidebarNav from "@/components/layout/AdminSidebarNav.vue";
import TopBar from "@/components/layout/TopBar.vue";

const drawerOpen = ref(false);
const route = useRoute();

watch(() => route.path, () => {
  drawerOpen.value = false;
});
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
  background: var(--bg-main);
}

.dash-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 100;
}

.main {
  display: grid;
  grid-template-rows: var(--header-height) 1fr;
}

.content {
  padding: 24px;
  width: 100%;
}

.backdrop {
  display: none;
}

@media (max-width: 1024px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }

  .dash-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 100%;
    z-index: 1000;
    transform: translateX(-100%);
    background: var(--brand-main);
    display: flex;
    flex-direction: column;
  }

  .dash-sidebar.open {
    transform: translateX(0);
    transition: transform 0.25s ease;
  }

  .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 999;
  }
}
</style>
