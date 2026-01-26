<template>
  <RouterLink
    :to="to"
    class="btn btn-main"
  >
    {{ label }}
  </RouterLink>
</template>

<script setup>
import { RouterLink } from "vue-router";

defineProps({
  label: {
    type: String,
    required: true
  },
  to: {
    type: [String, Object],
    required: true
  }
});
</script>

<style scoped>


</style>
