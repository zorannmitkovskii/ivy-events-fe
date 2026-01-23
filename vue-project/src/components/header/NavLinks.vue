<template>
  <ul class="nav-links">
    <li
      v-for="(item, index) in links"
      :key="index"
      class="nav-item"
    >
      <NavLink
        :to="item.to"
        :label="item.label"
      />
    </li>
  </ul>
</template>

<script setup>
import NavLink from "./NavLink.vue";

const links = [
  { label: "Weddings",          to: "/weddings" },
  { label: "Business",          to: "/business" },
  // { label: "Kids Birthdays",    to: "/kids-birthdays" },
  // { label: "Adults Birthdays",  to: "/adult-birthdays" },
  { label: "Baby",              to: "/baby" },
  { label: "Holiday",           to: "/holiday" },
  { label: "Invitation",        to: "/invitation" },
  { label: "Dashboard",         to: "/dashboard" },
  { label: "Admin",             to: "/admin" },
  { label: "Upload",            to: "/upload" }
];
</script>

<style scoped>
.nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
