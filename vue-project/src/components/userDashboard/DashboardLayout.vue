<template>
  <div class="dashboard-layout d-grid layout-grid">
    <DashboardSidebar class="sidebar" />
    <div class="main-content">
      <DashboardHeader />
      <div class="page-wrapper p-3">
        <router-view />
      </div>
    </div>
  </div>
</template>


<script setup>
import DashboardSidebar from "@/components/userDashboard/dashboard/DashboardSidebar.vue";
import DashboardHeader from "@/components/userDashboard/dashboard/DashboardHeader.vue";
</script>


<style scoped>
.layout-grid {
  grid-template-columns: 260px 1fr;
  height: 100vh;
}
.sidebar {
  height: 100vh;
  background: var(--logo-beige);
  border-right: 1px solid #d6c7b3;
}
.main-content {
  overflow-y: auto;
  background: #faf7f2;
}
@media (max-width: 768px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
  .sidebar {
    display: none;
  }
}
</style>
