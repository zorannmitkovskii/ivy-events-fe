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
  grid-template-columns: var(--dash-sidebar-w) 1fr;
  background: var(--d-ground);
}

.dash-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 100;
}

.main {
  display: grid;
  /* The bar sizes itself; --header-height is the public site's and is 18px
     taller than the dashboard bar, which left a gap under it. */
  grid-template-rows: auto 1fr;
  /*
    A grid item defaults to min-width:auto, so anything intrinsically wide
    inside — the top bar, a table — stretches the column past the viewport and
    the whole page scrolls sideways. Found at 360px while testing the nav grid
    (IVY-1103): the grid itself fit, the shell around it did not.
  */
  min-width: 0;
}

.content {
  max-width: 1500px;
  width: 100%;
  min-width: 0;
  margin: 0 auto;
  padding: 36px clamp(24px, 3vw, 48px) 70px;
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
    width: var(--dash-sidebar-w);
    z-index: 1000;
    transform: translateX(-100%);
    background: var(--d-side);
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
    background: rgba(7, 18, 13, 0.71);
    z-index: 999;
  }

  .content {
    padding: 26px 16px 50px;
  }
}
</style>
