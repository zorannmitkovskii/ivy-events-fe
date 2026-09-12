<template>
  <li class="feature" :class="{ 'feature--disabled': !isIncluded }">
    <svg v-if="isIncluded" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
    <span class="feature__text"><slot /></span>
  </li>
</template>

<script setup>
import { computed } from 'vue'

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
  included: { type: [Boolean, Object], default: true },
})

const isIncluded = computed(() => props.included !== false)
</script>

<style scoped>
/*
  `.plan li` in `ivy/site.css` already sets the row: the flex, the gap, the
  18px moss tick. What stays here is only the excluded state, which the design
  has no version of — its plans list what you get and say nothing about what
  you do not.
*/
.feature--disabled svg {
  color: var(--ink-3);
}

.feature--disabled .feature__text {
  color: var(--ink-3);
  text-decoration: line-through;
  text-decoration-color: var(--line-2);
}
</style>
