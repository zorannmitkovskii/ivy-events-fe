<template>
  <section class="auth-card">
    <div class="auth-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="auth-card__footer">
      <slot name="footer" />
    </div>
  </section>
</template>

<script setup></script>

<style scoped>
.auth-card {
  background: var(--bg-white);
  border-radius: 14px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
  border-top: 4px solid var(--brand-gold);
  overflow: hidden;
}
.auth-card__body {
  padding: 36px 36px 28px;
}
.auth-card__footer {
  background: rgba(247, 245, 240, 0.5);
  padding: 16px 36px;
  border-top: 1px solid rgba(231, 231, 231, 0.5);
  text-align: center;
}

@media (max-width: 480px) {
  .auth-card__body {
    padding: 28px 20px 22px;
  }
  .auth-card__footer {
    padding: 14px 20px;
  }
}
</style>
