<template>
  <div class="app-shell">
    <SidebarNav />

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import SidebarNav from "@/components/layout/SidebarNav.vue";
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.app-main {
  flex: 1;
  min-width: 0; /* important for scroll areas */
  background: #f7f6f2;
}
</style>
