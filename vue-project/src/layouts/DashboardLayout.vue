<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <SidebarNav />
    </aside>

    <div class="main">
      <TopBar />
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import SidebarNav from "@/components/layout/SidebarNav.vue";
import TopBar from "@/components/layout/TopBar.vue";
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
  background: var(--bg-main);
}

.main {
  display: grid;
  grid-template-rows: var(--header-height) 1fr;
}

.content {
  padding: 24px;
  width: 100%;
}

@media (max-width: 1024px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    display: none;
  }
}
</style>
