<template>
  <span class="pill" :class="[`pill--${tone}`, { 'pill--plain': plain }]">
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue'

/**
 * StatusPill — role pills, approval pills, RSVP pills and availability pills
 * were four separate implementations. This is the one.
 *
 * `status` keeps the old two-value API working (confirmed / pending); `tone`
 * is the direct form. None of the tones is the brand colour: the brand marks
 * what belongs to us, status marks what needs attention.
 */
const props = defineProps({
  /** ok | warn | error | info | brand | neutral */
  tone: { type: String, default: '' },
  /** Legacy: confirmed | pending. Ignored when `tone` is given. */
  status: { type: String, default: '' },
  label: { type: String, default: '' },
  /** Drop the leading dot — for pills that carry a count rather than a state. */
  plain: { type: Boolean, default: false },
})

const LEGACY = { confirmed: 'ok', pending: 'warn' }

const tone = computed(() => props.tone || LEGACY[props.status] || 'neutral')
</script>

<style scoped>
.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-family: var(--font-ui);
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  background: var(--sunken);
  color: var(--ink-2);
}

.pill::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.75;
  flex: none;
}
.pill--plain::before { display: none; }

.pill--ok { background: var(--success-pale); color: var(--success); }
.pill--warn { background: var(--warning-pale); color: var(--warning); }
.pill--error { background: var(--error-pale); color: var(--error); }
.pill--info { background: var(--info-pale); color: var(--info); }
.pill--brand { background: var(--brand-pale); color: var(--brand); }
</style>
