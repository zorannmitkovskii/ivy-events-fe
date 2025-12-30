<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>Admin Panel</h2>
    </div>

    <ul class="sidebar-menu">
      <li v-for="item in menuItems" :key="item.label">
        <router-link
          :to="item.route"
          class="menu-link"
          :class="{ active: $route.path === item.route }"
        >
          {{ item.label }}
        </router-link>
      </li>
    </ul>
  </aside>
</template>

<script setup>
const menuItems = [
  { label: "Dashboard", route: "/admin/dashboard" },
  { label: "Users", route: "/admin/users" },
  { label: "Vendors", route: "/admin/vendors" },
  { label: "Events", route: "/admin/events" },
  { label: "Locations", route: "/admin/locations" },
  { label: "Packages", route: "/admin/packages" },
  { label: "Categories", route: "/admin/categories" },
  { label: "Analytics", route: "/admin/analytics" },
  { label: "Notifications", route: "/admin/notifications" },
  { label: "Settings", route: "/admin/settings" },
];
</script>

<style scoped>
.sidebar {
  width: 220px;
  background-color: #1A73E8; /* primary color */
  color: white;
  padding: 20px 0;
  flex-shrink: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  text-align: center;
  margin-bottom: 20px;
}

.sidebar-header h2 {
  font-size: 1.5rem;
  color: white;
}

.sidebar-menu {
  list-style: none;
  padding-left: 0;
  flex-grow: 1;
}

.sidebar-menu li {
  margin-bottom: 15px;
}

.sidebar-menu a {
  color: white;
  text-decoration: none;
  padding: 10px 20px;
  display: block;
  border-radius: 5px;
  transition: background-color 0.2s;
}

.sidebar-menu a:hover {
  background-color: #FFD166; /* accent color */
}

.sidebar-menu a.active {
  background-color: #185ABC; /* secondary color */
  font-weight: bold;
}
</style>
