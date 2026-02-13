<template>
  <button
    :type="type"
    class="inline-flex items-center justify-center bg-pink-300 hover:bg-pink-400 text-white font-body font-semibold px-8 py-4 rounded-small shadow-custom hover:shadow-custom-hover transition-all duration-300"
    :class="className"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  type: { type: String, default: "button" },
  className: { type: String, default: "" },
});
defineEmits(["click"]);
</script>
