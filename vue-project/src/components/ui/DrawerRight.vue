<template>
  <div v-if="open" class="drawer-overlay" @click.self="$emit('close')">
    <aside class="drawer">
      <slot />
    </aside>
  </div>
</template>

<script setup>
defineProps({ open: Boolean });
defineEmits(["close"]);
</script>
