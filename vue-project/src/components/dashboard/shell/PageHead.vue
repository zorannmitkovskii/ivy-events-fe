<template>
  <div class="ph">
    <div>
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="acts">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
/**
 * The heading every dashboard page opens with: a title, a line of context and
 * the page's own actions on the right.
 */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>
