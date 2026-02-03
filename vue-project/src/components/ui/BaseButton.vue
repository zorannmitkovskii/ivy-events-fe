<template>
  <button :class="classes" :type="type" @click="$emit('click', $event)">
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'secondary' },
  type: { type: String, default: 'button' },
  size: { type: String, default: '' },
  block: { type: Boolean, default: false }
});

const classes = computed(() => {
  const base = ['btn'];
  const map = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline-secondary',
    danger: 'btn-danger',
  };
  base.push(map[props.variant] || 'btn-secondary');
  if (props.size === 'sm') base.push('btn-sm');
  if (props.size === 'lg') base.push('btn-lg');
  if (props.block) base.push('w-100');
  return base.join(' ');
});
</script>
