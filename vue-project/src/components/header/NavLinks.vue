<template>
  <ul class="navbar-nav ms-auto align-items-lg-center">
    <NavLink
      v-for="(item, index) in links"
      :key="index"
      :label="item.label"
      :to="item.to"
    />
  </ul>
</template>

<script setup>
import NavLink from './NavLink.vue'

const links = [
  { label: "Weddings",         to: "/weddings" },
  { label: "Business",         to: "/business" },
  { label: "Kids Birthdays",         to: "/kidsBirthdays" },
  { label: "Adults Birthdays",         to: "/adultBirthdays" },
  { label: "Baby",         to: "/baby" },
  { label: "Holiday",         to: "/holiday" },
  { label: "Invitation",         to: "/invitation" },
  { label: "Dashboard",         to: "/dashboard" },
  { label: "admin",         to: "/admin" },
  { label: "upload",         to: "/upload" }
]
</script>

<style scoped>
/* No need for extra styling unless you want spacing adjustments */
</style>
