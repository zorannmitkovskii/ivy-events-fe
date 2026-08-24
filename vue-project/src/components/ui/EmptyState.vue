<template>
  <!--
    A failed load is announced, not just drawn. Screen readers get nothing at
    all from a silently swapped block, and this one replaces the whole table.
  -->
  <div class="empty" :class="`empty--${tone}`" :role="tone === 'error' ? 'alert' : null">
    <div class="empty__art" aria-hidden="true">
      <slot name="art">{{ glyph }}</slot>
    </div>

    <h3>{{ title }}</h3>
    <p v-if="body">{{ body }}</p>

    <div v-if="$slots.action" class="empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * EmptyState — the same shape for "nothing yet", "nothing found" and
 * "could not load".
 *
 * The audit found about twenty of these, every one written differently, and
 * most offering nothing to press. An empty screen that gives the reader no
 * next move is a dead end, so `action` is a slot the caller is expected to
 * fill for the `first-run` tone.
 */
const props = defineProps({
  title: { type: String, required: true },
  body: { type: String, default: '' },
  /**
   * first-run — nothing exists yet; offer the one action that changes that.
   * no-results — filters or search matched nothing; offer to clear them.
   * error — the load failed; name what failed and offer to retry.
   */
  tone: {
    type: String,
    default: 'first-run',
    validator: (v) => ['first-run', 'no-results', 'error'].includes(v),
  },
})

const GLYPHS = { 'first-run': '＋', 'no-results': '⌕', error: '!' }
const glyph = computed(() => GLYPHS[props.tone])
</script>

<style scoped>
.empty {
  text-align: center;
  padding: 44px 24px;
  font-family: var(--font-ui);
}

.empty__art {
  width: 76px;
  height: 76px;
  margin: 0 auto 14px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 30px;
  line-height: 1;
  background: var(--brand-pale);
  color: var(--brand);
}
.empty--no-results .empty__art { background: var(--sunken); color: var(--ink-3); }
.empty--error .empty__art { background: var(--error-pale); color: var(--error); }

.empty h3 {
  font-family: var(--font-family);
  font-size: 19px;
  font-weight: 600;
  margin: 0 0 6px;
  color: var(--ink);
}

.empty p {
  color: var(--ink-2);
  font-size: 13.5px;
  margin: 0 auto;
  max-width: 44ch;
}

.empty__action { margin-top: 16px; }
</style>
