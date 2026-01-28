<template>
  <div class="pricing-badge">
    <slot>{{$t('pricing.badge.mostPopular')}}</slot>
  </div>
</template>

<script setup></script>

<style scoped>
.pricing-badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);

  background: var(--brand-gold);
  color: var(--bg-white);
  font-weight: 700;
  font-size: 12px;

  padding: 6px 14px;
  border-radius: 999px;
  box-shadow: var(--shadow-sm);
}
</style>
