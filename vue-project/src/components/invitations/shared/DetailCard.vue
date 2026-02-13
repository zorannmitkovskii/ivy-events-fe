<template>
  <div class="detail-card" :style="cardStyle">
    <div class="card-icon" :style="iconStyle">
      <slot name="icon">
        <span class="icon-fallback">{{ iconEmoji }}</span>
      </slot>
    </div>
    <h3 class="card-title">{{ title }}</h3>
    <slot />
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  accentColor: { type: String, default: '#FFD1BA' },
  bgColor: { type: String, default: '#FFFBF7' },
  borderColor: { type: String, default: '' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
  borderRadius: { type: String, default: '24px' },
  iconEmoji: { type: String, default: '' },
  shadow: { type: String, default: '6px 6px 0px rgba(255, 182, 193, 0.6)' },
  hoverShadow: { type: String, default: '' },
  borderWidth: { type: String, default: '2px' },
  iconBg: { type: String, default: '' },
});

const cardStyle = computed(() => ({
  '--card-accent': props.accentColor,
  '--card-bg': props.bgColor,
  '--card-border': props.borderColor || props.accentColor,
  '--card-heading-font': props.headingFont,
  '--card-body-font': props.bodyFont,
  '--card-radius': props.borderRadius,
  '--card-shadow': props.shadow,
  '--card-shadow-hover': props.hoverShadow || props.shadow,
  '--card-border-width': props.borderWidth,
}));

const iconStyle = computed(() => ({
  background: props.iconBg || props.accentColor,
}));
</script>

<style scoped>
.detail-card {
  background: var(--card-bg);
  padding: 32px;
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  text-align: center;
  border: var(--card-border-width) solid var(--card-border);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.detail-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--card-shadow-hover);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #333;
}

.icon-fallback {
  font-size: 24px;
}

.card-title {
  font-family: var(--card-heading-font);
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
}

.card-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e5e5;
}

:slotted(p) {
  font-family: var(--card-body-font);
  margin: 0 0 4px;
  color: #666;
  font-size: 15px;
  line-height: 1.5;
}

:slotted(.bold) {
  font-weight: 700;
  color: #555;
}

:slotted(a) {
  font-size: 14px;
  font-weight: 700;
  color: #555;
  text-decoration: underline;
  text-underline-offset: 4px;
}

:slotted(a):hover {
  color: #333;
}
</style>
