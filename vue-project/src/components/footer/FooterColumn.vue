<template>
  <div class="col-md-3">
    <h5 class="fw-bold mb-3 text-logo-brown">{{ title }}</h5>
    <ul class="list-unstyled mb-0">
      <slot />
    </ul>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true }
})
</script>

<style scoped>
.text-logo-brown {
  color: var(--logo-brown);
}
</style>
