<template>
  <div class="or">
    <span></span>{{ label }}<span></span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: "Or continue with email" }
});
</script>

<style scoped>
/* `.or` — a rule, the label, a rule — is the design's, in `ivy/site.css`. */
</style>
