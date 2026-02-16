<template>
  <div class="glass-panel rounded-large shadow-custom" :class="className">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  className: { type: String, default: "" },
});
</script>
