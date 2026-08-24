<template>
  <component
    :is="to ? 'RouterLink' : 'article'"
    :to="to"
    class="stat-card"
    :class="[`tone-${tone}`, { linked: Boolean(to) }]"
  >
    <header class="head">
      <h2>{{ label }}</h2>
      <InfoHint v-if="hint" :text="hint" :label="hintLabel" />
    </header>

    <p class="figure">
      <span v-if="tone !== 'neutral'" class="glyph" aria-hidden="true">{{ GLYPHS[tone] }}</span>
      {{ value }}
    </p>

    <dl v-if="rows.length" class="rows">
      <div v-for="row in rows" :key="row.label">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>

    <slot />
  </component>
</template>

<script setup>
/**
 * One KPI.
 *
 * <p>The figure is the loudest thing on the card on purpose. The screen this
 * replaces set every number in the same weight and colour as its label, so
 * nothing could be scanned — the eye had to read to find the data.
 *
 * <p>A tone adds a glyph, never colour alone. Roughly one man in twelve cannot
 * separate the warning amber from the neutral grey, and the count of late work
 * is exactly the number that must not go unnoticed by them.
 *
 * <p>Renders as a link when `to` is given, so the whole card is clickable,
 * middle-clickable and keyboard-reachable without any handler of its own.
 */
import { RouterLink } from 'vue-router'
import InfoHint from '@/components/dashboard/InfoHint.vue'

const GLYPHS = {
  neutral: '',
  good: '●',
  warning: '▲',
  critical: '▲',
}

defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  /** neutral | good | warning | critical — drives the accent and the glyph. */
  tone: { type: String, default: 'neutral' },
  /** `[{ label, value }]` shown under the figure. */
  rows: { type: Array, default: () => [] },
  hint: { type: String, default: '' },
  hintLabel: { type: String, default: '' },
  to: { type: [String, Object], default: null },
})
</script>

<style scoped>
.stat-card {
  /* Stretch so a card with fewer rows does not leave a hole in the grid. */
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--cards-color, #fff);
  border: 1px solid var(--border-color, #e6e5e1);
  border-radius: 12px;
  padding: 16px;
  text-decoration: none;
  color: inherit;
  --tone-accent: transparent;
  box-shadow: inset 4px 0 0 var(--tone-accent);
}

/*
  The tone accent is an inset shadow, not a thick left border (IVY-1204).

  A 4px left border against a 1px one under a 12px radius makes the browser
  interpolate that corner elliptically: the thick edge keeps its full height
  while the thin edges curve away, and the accent reads as a bar sticking out
  past the card. An inset shadow follows the radius exactly and leaves the
  border uniform.
*/
.stat-card.tone-good { --tone-accent: #0ca30c; }
.stat-card.tone-warning { --tone-accent: #fab219; }
.stat-card.tone-critical { --tone-accent: #d03b3b; }

.linked {
  cursor: pointer;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.linked:hover,
.linked:focus-visible {
  border-color: var(--brand-main, #0b0b0b);
  /* The accent is carried through: a hover state that drops it would make the
     card change meaning while the pointer is over it. */
  box-shadow: inset 4px 0 0 var(--tone-accent), 0 4px 14px rgba(0, 0, 0, 0.08);
}

.linked:focus-visible {
  outline: 2px solid var(--brand-main, #0b0b0b);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .linked { transition: none; }
}

.head {
  font-family: var(--font-ui);
  display: flex;
  align-items: center;
  gap: 6px;
}

.head h2 {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #52514e);
}

.figure {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  /* The point of the card. Heavier and darker than anything around it. */
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-color, #0b0b0b);
  /*
   * Numbers leave the brand serif behind. Cormorant Garamond is a
   * high-contrast display face: its bold still reads thin at any size, and its
   * digits are old-style, so a KPI set in it looks washed out however dark and
   * heavy the CSS says it is. That was the actual cause of the flat dashboard,
   * not the weight — which was already 700.
   *
   * Tabular figures so a column of counts lines up instead of shimmering as
   * the values change.
   */
  font-family: var(--font-ui);
  font-variant-numeric: tabular-nums;
}

.glyph {
  font-size: 1rem;
  line-height: 1;
}

.tone-good .glyph { color: #0ca30c; }
.tone-warning .glyph { color: #b07600; }
.tone-critical .glyph { color: #d03b3b; }

.rows {
  font-family: var(--font-ui);
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rows > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.85rem;
}

.rows dt {
  margin: 0;
  color: var(--text-muted, #52514e);
}

.rows dd {
  margin: 0;
  font-weight: 600;
  color: var(--text-color, #0b0b0b);
  font-family: var(--font-ui);
  font-variant-numeric: tabular-nums;
}
</style>
