<template>
  <div class="rounded-large shadow-custom p-6" :class="bgClass">
    <h3 class="font-heading text-2xl text-gray-800 mb-3">{{ title }}</h3>
    <p class="font-body text-gray-600 leading-relaxed">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  text: { type: String, required: true },
  bgClass: { type: String, default: "bg-pink-50" },
});
</script>
