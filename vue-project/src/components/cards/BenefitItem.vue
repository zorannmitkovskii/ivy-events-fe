<template>
  <article class="benefit-item">
    <div class="benefit-icon" aria-hidden="true">
      <i :class="iconClass"></i>
    </div>

    <div class="benefit-content">
      <h4 class="benefit-title">{{ title }}</h4>
      <p class="benefit-desc">{{ description }}</p>
    </div>
  </article>
</template>

<script setup>
defineProps({
  iconClass: { type: String, required: true }, // e.g. "fas fa-layer-group"
  title: { type: String, required: true },
  description: { type: String, required: true },
  highlight: { type: Boolean, default: false } // green background like first item
});
</script>

<style scoped>
.benefit-item {
  display: flex;
  align-items: center;
  gap: 16px;

  background: var(--bg-main);
  border-radius: var(--radius-lg);
  padding: 18px 18px;

  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0,0,0,0.03);

  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.benefit-item:hover {
  background: var(--brand-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* left icon square */
.benefit-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--brand-main);

  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.benefit-icon i {
  color: var(--bg-white);
  font-size: 18px;
  line-height: 1;
}

.benefit-title {
  margin: 0 0 4px;
  font-weight: 700;
  font-size: 14px;
  color: var(--neutral-900);
}

.benefit-desc {
  margin: 0;
  font-size: 13px;
  color: var(--neutral-700);
  line-height: 1.5;
}
</style>
