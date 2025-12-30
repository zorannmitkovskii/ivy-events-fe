<template>
  <div class="dashboard-layout container">
    <aside class="dashboard-sidebar">
      <Sidebar />
    </aside>

    <div class="main-col">
      <Header />
      <main class="page-wrapper">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './DashboardSidebar.vue'
import Header from './DashboardHeader.vue'
</script>

<style scoped>
.main-col {
  display:flex;
  flex-direction:column;
  min-height:100vh;
}
</style>
