<template>
  <li class="nav-item" :class="extraClass">
    <router-link class="nav-link" :to="to">{{ label }}</router-link>
  </li>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  to: { type: String, required: false, default: '#' },
  extraClass: { type: String, required: false, default: '' } // for things like ms-lg-3
})
</script>
