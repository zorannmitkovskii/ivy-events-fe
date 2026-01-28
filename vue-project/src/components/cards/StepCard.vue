<template>
  <article class="step-card">
    <div class="step-icon">
      <i :class="iconClass" aria-hidden="true"></i>
    </div>

    <div class="step-number">{{ number }}</div>

    <h3 class="step-title">{{ title }}</h3>
    <p class="step-desc">{{ description }}</p>
  </article>
</template>

<script setup>
defineProps({
  number: { type: [Number, String], required: true },
  iconClass: { type: String, required: true }, // e.g. "fas fa-paper-plane"
  title: { type: String, required: true },
  description: { type: String, required: true }
});
</script>

<style scoped>
.step-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px 12px;
}

/* green icon chip */
.step-icon {
  width: 100px;
  height: 100px;
  border-radius: 18px;
  background: var(--secondary-sage);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

/* font awesome icon style (monochrome like design) */
.step-icon i {
  font-size: 48px;
  color: var(--brand-main);
  line-height: 1;
}

.step-number {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: var(--brand-gold);
  color: var(--bg-white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin: 0 0 18px;
}

.step-title {
  margin: 0 0 12px;
  font-family: var(--font-family), serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900);
}

.step-desc {
  margin: 0;
  max-width: 260px;
  color: var(--neutral-700);
  font-size: 14px;
  line-height: 1.7;
}
</style>
