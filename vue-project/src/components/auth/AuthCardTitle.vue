<template>
  <header class="auth-title">
    <p v-if="eyebrow" class="tag">{{ eyebrow }}</p>
    <h1>{{ title }}</h1>
    <p v-if="subtitle">{{ subtitle }}</p>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  /* The small letter-spaced line above the heading. Optional so the pages
     that have nothing useful to put there — reset password, verify email —
     simply do not render one. */
  eyebrow: { type: String, default: "" }
});
</script>

<style scoped>
.auth-title {
  display: contents;
}

.auth-title h1 {
  font: 50px var(--font-display);
  margin: 0;
}

.auth-title p:not(.tag) {
  margin: 8px 0 18px;
  font: 13px/1.7 var(--font-display);
  color: var(--ink-3);
}

@media (max-width: 580px) {
  .auth-title h1 {
    font-size: 38px;
  }
}
</style>
