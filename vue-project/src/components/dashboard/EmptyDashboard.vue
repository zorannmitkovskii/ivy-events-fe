<template>
  <section class="empty-state">
    <!--
      Drawn here rather than shipped as an image: it is four shapes, it inherits
      the page's colours, it costs no request, and it stays crisp on any screen.
      aria-hidden because the heading beside it already says what it means — a
      described decoration is read twice.
    -->
    <svg class="art" viewBox="0 0 240 150" role="presentation" aria-hidden="true" focusable="false">
      <rect x="34" y="26" width="118" height="96" rx="10" class="sheet" />
      <rect x="34" y="26" width="118" height="22" rx="10" class="sheet-head" />
      <line x1="60" y1="20" x2="60" y2="34" class="ring" />
      <line x1="126" y1="20" x2="126" y2="34" class="ring" />
      <line x1="50" y1="66" x2="104" y2="66" class="rule" />
      <line x1="50" y1="82" x2="128" y2="82" class="rule" />
      <line x1="50" y1="98" x2="86" y2="98" class="rule" />
      <circle cx="176" cy="94" r="26" class="badge" />
      <line x1="176" y1="82" x2="176" y2="106" class="plus" />
      <line x1="164" y1="94" x2="188" y2="94" class="plus" />
    </svg>

    <div class="words">
      <h3>{{ title }}</h3>
      <p>{{ body }}</p>
      <RouterLink v-if="to" :to="to" class="cta">{{ action }}</RouterLink>
    </div>
  </section>
</template>

<script setup>
/**
 * What a dashboard says before there is anything to say (IVY-1204).
 *
 * <p>A brand-new agency used to meet five zeros, three sentences explaining
 * that there was nothing, and nowhere to press. Zero is an accurate number and
 * a poor first screen: it describes the state without offering the one action
 * that changes it.
 *
 * <p>One component so the wording and the artwork cannot drift apart between
 * the places that need it.
 */
import { RouterLink } from 'vue-router'

defineProps({
  title: { type: String, required: true },
  body: { type: String, required: true },
  /** The one thing worth doing from here. Omit for a state nobody can act on. */
  action: { type: String, default: '' },
  to: { type: [String, Object], default: null },
})
</script>

<style scoped>
.empty-state {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 4px;
  flex-wrap: wrap;
}

.art {
  width: 200px;
  height: 125px;
  flex: none;
}

.sheet {
  fill: var(--cards-color, #fff);
  stroke: var(--border-color, #e6e5e1);
  stroke-width: 2;
}

.sheet-head {
  fill: var(--dash-sage-ghost, #f1f6ee);
  stroke: var(--border-color, #e6e5e1);
  stroke-width: 2;
}

.ring,
.rule {
  stroke: var(--border-color, #cfd6cb);
  stroke-width: 3;
  stroke-linecap: round;
}

.rule {
  stroke-width: 4;
}

.badge {
  fill: var(--dash-sage-ghost, #f1f6ee);
  stroke: var(--dash-sage, var(--brand));
  stroke-width: 2;
}

.plus {
  stroke: var(--dash-sage, var(--brand));
  stroke-width: 4;
  stroke-linecap: round;
}

.words {
  font-family: var(--font-ui);
  min-width: 220px;
  flex: 1;
}

.words h3 {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color, #0b0b0b);
}

.words p {
  margin: 0 0 12px;
  font-size: 0.875rem;
  color: var(--text-muted, #52514e);
  max-width: 46ch;
}

.cta {
  display: inline-block;
  padding: 9px 18px;
  border-radius: 8px;
  background: var(--brand-main, #0b0b0b);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}

.cta:hover {
  background: var(--brand-dark, #000);
}

.cta:focus-visible {
  outline: 2px solid var(--brand-main, #0b0b0b);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .cta { transition: none; }
}
</style>
