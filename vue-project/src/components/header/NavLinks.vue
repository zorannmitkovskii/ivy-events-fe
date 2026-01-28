<template>
  <ul class="nav-links">
    <li
      v-for="(item, index) in links"
      :key="index"
      class="nav-item"
    >
      <NavLink
        :to="item.to"
        :labelKey="item.labelKey"
        :label="item.label"
      />
    </li>
  </ul>
</template>

<script setup>
import NavLink from "./NavLink.vue";

const links = [
  { labelKey: "nav.weddings",     to: "/weddings" },
  { labelKey: "nav.business",     to: "/business" },
  // { labelKey: "nav.kidsBirthdays", to: "/kids-birthdays" },
  // { labelKey: "nav.adultBirthdays", to: "/adult-birthdays" },
  { labelKey: "nav.baby",         to: "/baby" },
  { labelKey: "nav.holiday",      to: "/holiday" },
  { labelKey: "nav.invitation",   to: "/invitation" },
  { labelKey: "nav.dashboard",    to: "/dashboard" },
  { labelKey: "nav.admin",        to: "/admin" },
  { labelKey: "nav.upload",       to: "/upload" }
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
