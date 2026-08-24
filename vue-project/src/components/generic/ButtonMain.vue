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
    validator: (v) => ["main", "outline", "gold", "secondary", "ghost", "danger", "success"].includes(v)
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
/* ===== Base =====
   The 2026 redesign's button, so a ButtonMain sitting on a redesigned page
   and a bare `.btn` next to it are the same object: 46px tall, 10px radius,
   small letter-spaced caps in the UI face, and a 2px lift on hover. */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  min-height: 46px;
  padding: 0 24px;

  border-radius: var(--radius-control);
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-decoration: none;
  cursor: pointer;
  user-select: none;

  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    background 0.3s ease,
    border-color 0.3s ease,
    color 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(23, 55, 43, 0.18);
}

/* focus */
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(23, 55, 43, 0.2);
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
  background: var(--gold);
  color: var(--bg-white);
  border: 1px solid var(--gold);
}

.btn--gold:hover {
  background: var(--gold-text);
  border-color: var(--gold-text);
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

/* Ghost – subtle, white bg */
.btn--ghost {
  background: #fff;
  color: var(--brand-main);
  border: 1px solid var(--neutral-300);
}

.btn--ghost:hover {
  background: var(--neutral-100);
  transform: translateY(-1px);
}

/* Success – sage green bg, dark text */
.btn--success {
  background: var(--success);
  color: var(--brand-main);
  border: 1px solid var(--success);
}

.btn--success:hover {
  filter: brightness(0.95);
  transform: translateY(-1px);
}

/* Danger */
.btn--danger {
  background: #fff5f5;
  color: #b00020;
  border: 1px solid #ffd2d2;
}

.btn--danger:hover {
  background: #ffe0e0;
  transform: translateY(-1px);
}
</style>
