<template>
  <div class="flex items-start gap-4">
    <span class="text-white font-body text-sm px-4 py-2 rounded-full whitespace-nowrap" :class="badgeClass">
      {{ time }}
    </span>
    <div class="bg-white rounded-large shadow-custom p-6 flex-1">
      <h3 class="font-heading text-xl text-gray-800 mb-2">{{ title }}</h3>
      <p class="font-body text-gray-600">{{ description }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  time: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  badgeClass: { type: String, default: "bg-pink-300" },
});
</script>
