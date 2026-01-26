<template>
  <button :class="classes" type="button">
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | outline | ghost
  size: { type: String, default: 'md' }, // sm | md | lg
})

const classes = computed(() => {
  return [
    'button',
    props.variant === 'outline' && 'button--outline',
    props.variant === 'ghost' && 'button--ghost',
    props.size === 'sm' && 'button--sm',
    props.size === 'lg' && 'button--lg',
  ]
})
</script>

<style scoped>
@import '@/assets/styles/variables.css';
@import '@/assets/styles/buttons.css';
</style>
