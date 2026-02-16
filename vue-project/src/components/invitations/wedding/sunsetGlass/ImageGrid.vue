<template>
  <div class="grid grid-cols-2 gap-4">
    <img v-for="(img, i) in images" :key="i"
         :src="img.src" :alt="img.alt"
         class="rounded-large shadow-custom w-full h-64 object-cover"
         :class="img.className"
    />
  </div>
</template>

<script setup>
defineProps({
  images: { type: Array, default: () => [] },
});
</script>
