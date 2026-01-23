<!--<template>-->
<!--  <li class="nav-item" :class="extraClass">-->
<!--    <router-link class="nav-link" :to="to">{{ label }}</router-link>-->
<!--  </li>-->
<!--</template>-->

<!--<script setup>-->
<!--defineProps({-->
<!--  label: { type: String, required: true },-->
<!--  to: { type: String, required: false, default: '#' },-->
<!--  extraClass: { type: String, required: false, default: '' } // for things like ms-lg-3-->
<!--})-->
<!--</script>-->
<template>
  <li>
    <router-link class="nav-link" :to="to">{{ label }}</router-link>
  </li>
</template>

<script setup>
import { RouterLink } from "vue-router";

defineProps({
  label: { type: String, required: true },
  to: { type: String, required: false, default: '#' }
});
</script>

<style scoped>
.nav-link {
  text-decoration: none;
  color: var(--neutral-700);
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--brand-dark);
}

/* Active route */
.nav-link.active {
  color: var(--brand-dark);
  font-weight: 600;
}
</style>
