<template>
  <RouterLink
    :to="to"
    class="btn btn-primary"
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

.btn-primary {
  background: var(--brand-main);
  border: 1px solid var(--brand-main);
  color: var(--white);
}

.btn-primary::before {
  background: var(--brand-dark);
  border: 1px solid var(--brand-dark);
}

.btn-primary:hover::before {
  transform: translateY(0);
  border: 1px solid var(--brand-dark);
}

.btn-primary:hover {
  border: 1px solid var(--brand-dark);
}
</style>
