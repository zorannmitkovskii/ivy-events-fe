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

/* Size comes from `.authform h1` in `ivy/auth.css`, which clamps it the way
   every other heading in the September design is clamped. A fixed 50px here
   was the August scale and overflowed the column on a narrow phone. */
.auth-title h1 {
  margin: 0;
}

.auth-title p:not(.tag) {
  margin: 10px 0 22px;
  font-family: var(--font-ui);
  font-size: 16px;
  line-height: 1.5;
  color: var(--ink-2);
}
</style>
