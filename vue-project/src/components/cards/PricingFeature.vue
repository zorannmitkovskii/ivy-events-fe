<template>
  <li class="feature" :class="{ 'feature--disabled': !isIncluded }">
    <span class="feature__icon" aria-hidden="true">
      {{ isIncluded ? "✓" : "✕" }}
    </span>
    <span class="feature__text">
      <slot />
    </span>
  </li>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  /**
   * Only an explicit `false` crosses a line out.
   *
   * <p>A prop default covers `undefined` and not `null`, and the API's
   * `included` is nullable — so a feature whose flag was never set arrived as
   * null, read as falsy, and was struck through as though the plan did not
   * include it. The column's own default is TRUE, so null meant the opposite of
   * what the page showed. Crossing something out is a claim; it should take
   * somebody actually saying so.
   */
  included: { type: [Boolean, Object], default: true }
});

const isIncluded = computed(() => props.included !== false);
</script>

<style scoped>
/*
  The redesign lists features flush left with a bare tick — no pill behind it,
  nothing centred. Centring is what made the old list read as a poster rather
  than something to scan down; the design's price cards are read line by line.
*/
.feature {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 0;
  padding: 9px 0;
  border-bottom: 1px solid #edf0ed;
  font-family: var(--font-ui);
  font-size: 10px;
  line-height: 1.7;
  color: var(--ink);
}

.feature__icon {
  flex: none;
  color: #78966d;
  font-weight: 700;
}

.feature--disabled .feature__text {
  color: var(--ink-4);
  text-decoration: line-through;
  text-decoration-color: var(--line-2);
}

.feature--disabled .feature__icon {
  color: var(--ink-4);
}
</style>
