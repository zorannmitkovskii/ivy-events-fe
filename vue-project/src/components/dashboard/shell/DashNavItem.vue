<template>
  <router-link :to="to" :aria-current="active ? 'page' : null">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" v-html="icon"></svg>
    <span class="snav-label">{{ label }}</span>
    <span v-if="count" class="n">{{ count }}</span>
  </router-link>
</template>

<script setup>
/**
 * One row in the dashboard sidebar.
 *
 * The gold pill on the right is a count, not a badge of text: the design uses
 * it for "nine guests have not replied", and a number is the only thing that
 * fits in it. Zero renders nothing rather than a "0" nobody needs to act on.
 */
defineProps({
  to: { type: [String, Object], required: true },
  label: { type: String, required: true },
  icon: { type: String, required: true },
  count: { type: [Number, String], default: 0 },
  active: { type: Boolean, default: false },
})
</script>

<style scoped>
/* `.snav a` is the design's, in `ivy/dash.css`. The label needs to be able to
   shrink so a long translation ellipsises instead of pushing the count out. */
.snav-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
