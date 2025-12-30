<template>
  <div>
    <h4 class="text-brand-dark fw-bold mb-3">Wedding Planner</h4>

    <nav>
      <router-link v-for="item in links" :key="item.to" :to="item.to" class="sidebar-link">
      {{ item.label }}
    </router-link>
    </nav>

    <hr class="my-3" />
    <small class="text-muted">Quick actions</small>
    <div class="mt-2 d-grid">
      <button class="btn btn-outline-secondary btn-sm mb-2">Add guest</button>
      <button class="btn btn-outline-secondary btn-sm">Add task</button>
    </div>
  </div>
</template>

<script setup>
const links = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Basic Info', to: '/basic' },
  { label: 'Guests', to: '/guests' },
  { label: 'Table Preview', to: '/tables' },
  { label: 'Budget', to: '/budget' },
  { label: 'Vendors', to: '/vendors' },
  { label: 'Tasks', to: '/tasks' },
  { label: 'Timeline', to: '/timeline' },
  { label: 'Gallery', to: '/gallery' }
]
</script>

<style scoped>
/* local tweaks if needed */
</style>
