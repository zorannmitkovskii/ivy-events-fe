<template>
  <RouterLink
    :to="to"
    class="btn btn-outline"
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

.btn-outline {
  border: 1px solid var(--brand-main);
  color: var(--brand-main);
  background: transparent;
}

.btn-outline::before {
  background: var(--brand-main);
}

.btn-outline:hover {
  color: var(--white);
}

.btn-outline:hover::before {
  transform: translateY(0);
}

</style>
