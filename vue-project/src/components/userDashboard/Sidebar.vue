<template>
  <div class="sidebar p-3 d-flex flex-column">
    <h4 class="text-brand-dark fw-bold mb-4">Wedding Planner</h4>
    <ul class="nav flex-column gap-2">
      <li v-for="item in links" :key="item.to">
        <router-link class="sidebar-link" :to="item.to">{{ item.label }}</router-link>
      </li>
    </ul>
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
.sidebar-link {
  padding: 10px;
  border-radius: 6px;
  color: var(--logo-brown);
  font-weight: 500;
}
.sidebar-link:hover {
  background: var(--logo-brown);
  color: #fff;
}
.router-link-active {
  background: var(--logo-brown) !important;
  color: #fff !important;
}
</style>
