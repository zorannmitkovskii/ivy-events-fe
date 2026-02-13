<template>
  <div class="auth-brand">
    <div class="auth-brand__icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 3h12l4 6-10 13L2 9z" />
        <path d="M11 3l1 6h6" />
        <path d="M2 9h20" />
        <path d="M13 3l-1 6H6" />
      </svg>
    </div>
    <h2 class="auth-brand__text">{{ title || $t('auth.brand') }}</h2>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' }
});
</script>

<style scoped>
.auth-brand {
  text-align: center;
  margin-bottom: 28px;
}
.auth-brand__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(200, 162, 77, 0.3);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  margin-bottom: 10px;
  color: var(--brand-gold);
}
.auth-brand__text {
  font-family: var(--font-family), serif;
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: var(--brand-main);
  margin: 0;
  text-transform: uppercase;
}
</style>
