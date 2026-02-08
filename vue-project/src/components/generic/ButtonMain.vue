<template>
  <component
    :is="componentTag"
    :to="isLink ? to : undefined"
    class="btn"
    :class="[variantClass, { 'is-disabled': isDisabled }]"
    :type="!isLink ? type : undefined"
    :disabled="!isLink ? isDisabled : undefined"
    :aria-disabled="isLink ? String(isDisabled) : undefined"
    :tabindex="isLink && isDisabled ? -1 : undefined"
    @click="onClick"
  >
    <span v-if="loading" class="spinner" aria-hidden="true"></span>
    <slot>{{ label }}</slot>
  </component>
</template>

<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";

const emit = defineEmits(["click"]);

const props = defineProps({
  label: { type: String, default: "" },

  // optional: if set => RouterLink
  to: { type: [String, Object], default: null },

  variant: {
    type: String,
    default: "main",
    validator: (v) => ["main", "outline", "gold", "secondary"].includes(v)
  },

  // button-only
  type: { type: String, default: "button" },

  disabled: { type: Boolean, default: false },

  // NEW: show spinner + block clicks
  loading: { type: Boolean, default: false }
});

const isLink = computed(() => !!props.to);
const componentTag = computed(() => (isLink.value ? RouterLink : "button"));
const variantClass = computed(() => `btn--${props.variant}`);
const isDisabled = computed(() => props.disabled || props.loading);

function onClick(e) {
  // block click for both link + button
  if (isDisabled.value) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // emit click always (useful for button; optional for link handlers too)
  emit("click", e);
}
</script>

<style scoped>
/* ===== Base ===== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  height: 44px;
  padding: 0 18px;

  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  user-select: none;

  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

/* 1px up on hover */
.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* focus */
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(200, 162, 77, 0.25);
}

/* ===== Disabled / loading ===== */
.is-disabled {
  opacity: 0.65;
  cursor: not-allowed;
  pointer-events: none; /* blocks RouterLink too */
  transform: none !important;
  box-shadow: none !important;
}

/* ===== Spinner ===== */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 999px;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== Variants ===== */

/* Solid brand main */
.btn--main {
  background: var(--brand-main);
  color: var(--bg-white);
  border: 1px solid var(--brand-main);
}

.btn--main:hover {
  background: var(--brand-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(147, 162, 154, 0.3);
}

/* Outline brand main */
.btn--outline {
  background: var(--bg-white);
  color: var(--brand-main);
  border: 1px solid var(--brand-main);
}

.btn--outline:hover {
  background: var(--brand-main);
  color: white;
  transform: translateY(-2px);
}

/* Solid gold */
.btn--gold {
  background: var(--brand-gold);
  color: var(--bg-white);
  border: 1px solid var(--brand-gold);
}

.btn--gold:hover {
  background: var(--secondary-gold);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(200, 162, 77, 0.3);
}

/* Secondary */
.btn--secondary {
  background: var(--brand-dark);
  color: var(--bg-white);
  border: 1px solid var(--brand-main);
}

.btn--secondary:hover {
  background: var(--brand-main);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(147, 162, 154, 0.3);
}
</style>
