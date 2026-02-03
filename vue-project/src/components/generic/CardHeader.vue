<template>
  <header class="card-header">
    <h1 class="title">{{ $t("checkout.header.title") }}</h1>
    <p class="subtitle">
      <span class="lock" aria-hidden="true">🔒</span>
      {{ $t("checkout.header.subtitle") }}
    </p>
  </header>
</template>

<script setup>
</script>

<style scoped>
.card-header {
  text-align: center;
  padding-top: 6px;
}

.title {
  margin: 0;
  font-size: 34px;
  line-height: 1.15;
  color: var(--neutral-900);
  font-weight: 700;
}

.subtitle {
  margin: 10px 0 0;
  font-size: 12px;
  color: rgba(51, 67, 56, 0.7);
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.lock {
  color: var(--brand-gold);
}
</style>
