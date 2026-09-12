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
   The 2026 redesign's button, so a ButtonMain sitting on a redesigned page and
   a bare `.btn` next to it are the same object. That promise broke when the
   September system landed and this file kept the August one: 46px and a 10px
   radius beside a 50px pill, 11px letter-spaced caps beside 16px semibold.
   These are `site.css`'s `.btn` values, restated because this component is
   also used on screens the design's stylesheet does not reach.

   The hover lift is gone with it. The design moves a button 1px *down* on
   press and not at all on hover; a 2px rise with a 28px shadow was the older,
   louder idiom. */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  min-height: 50px;
  padding: 0 24px;

  border-radius: var(--radius-button);
  font-family: var(--font-ui);
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  user-select: none;

  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease;
}

.btn:active {
  transform: translateY(1px);
}

/* focus */
.btn:focus-visible {
  outline: 3px solid var(--moss);
  outline-offset: 3px;
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
  color: var(--on-ivy);
  border: 1.5px solid var(--brand-main);
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
  color: var(--on-ivy);
}

/* Solid gold */
.btn--gold {
  background: var(--gold);
  color: var(--on-gold);
  border: 1.5px solid var(--gold);
}

.btn--gold:hover {
  background: var(--gold-deep);
  border-color: var(--gold-deep);
  color: #fff;
}

/* Secondary */
.btn--secondary {
  background: var(--brand-dark);
  color: var(--bg-white);
  border: 1px solid var(--brand-main);
}

.btn--secondary:hover {
  background: var(--brand-main);
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
