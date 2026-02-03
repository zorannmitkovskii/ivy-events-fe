<template>
  <header class="auth-title">
    <h1 class="auth-title__h">{{ title }}</h1>
    <p v-if="subtitle" class="auth-title__p">{{ subtitle }}</p>
  </header>
</template>

<script setup>
defineProps({
  title: {type: String, required: true},
  subtitle: {type: String, default: ""},
  showAccent: {type: Boolean, default: true}
});
</script>

<style scoped>
.auth-title {
  margin-bottom: 18px;
}

.auth-title__h {
  font-size: 44px;
  line-height: 1.05;
  color: var(--brand-main);
  margin: 0;
  text-align: center;
}

.auth-title__p {
  margin: 8px 0 0;
  color: var(--brand-dark);
  text-align: center;
}

@media (max-width: 992px) {
  .auth-title__h {
    font-size: 38px;
  }
}
</style>
