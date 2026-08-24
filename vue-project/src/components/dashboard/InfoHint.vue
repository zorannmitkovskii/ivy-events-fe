<template>
  <span class="info-hint">
    <button
      ref="trigger"
      type="button"
      class="dot"
      :aria-label="label"
      :aria-expanded="open"
      @click="open = !open"
      @blur="open = false"
      @keydown.esc="open = false"
    >i</button>
    <span v-if="open" class="bubble" role="tooltip">{{ text }}</span>
  </span>
</template>

<script setup>
/**
 * The explanation a metric needs, out of the way until asked for.
 *
 * <p>These notes used to sit under the cards as permanent small print, which is
 * the worst of both: too small to read comfortably, too present to ignore.
 *
 * <p>A button rather than a hover-only tooltip. Hover excludes touch and
 * keyboard entirely, and a definition that only a mouse can reach is a
 * definition most readers never see.
 */
import { ref } from 'vue'

defineProps({
  text: { type: String, required: true },
  label: { type: String, required: true },
})

const open = ref(false)
</script>

<style scoped>
.info-hint {
  position: relative;
  display: inline-flex;
}

.dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--border-color, #cbd0d6);
  background: transparent;
  color: var(--text-muted, #52514e);
  font-size: 0.65rem;
  font-style: italic;
  font-weight: 700;
  line-height: 1;
  cursor: help;
  padding: 0;
}

.dot:hover,
.dot:focus-visible {
  border-color: var(--text-color, #0b0b0b);
  color: var(--text-color, #0b0b0b);
}

.bubble {
  position: absolute;
  top: 22px;
  left: -8px;
  z-index: 20;
  width: max-content;
  max-width: 260px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #1a1a19;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 400;
  line-height: 1.35;
  text-transform: none;
  letter-spacing: normal;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}
</style>
