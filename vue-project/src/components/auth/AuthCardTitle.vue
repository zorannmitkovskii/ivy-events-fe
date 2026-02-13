<template>
  <header class="auth-title">
    <h1 class="auth-title__h">{{ title }}</h1>
    <p v-if="subtitle" class="auth-title__p">{{ subtitle }}</p>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" }
});
</script>

<style scoped>
.auth-title {
  margin-bottom: 24px;
  text-align: center;
}
.auth-title__h {
  font-family: var(--font-family), serif;
  font-size: 30px;
  font-weight: 600;
  line-height: 1.15;
  color: var(--brand-main);
  margin: 0 0 8px;
}
.auth-title__p {
  margin: 0;
  font-size: 14px;
  color: var(--neutral-500);
  font-weight: 300;
}

@media (max-width: 480px) {
  .auth-title__h {
    font-size: 26px;
  }
}
</style>
