<template>
  <section class="py-16 lg:py-20 px-6 bg-white max-h-[1000px] overflow-auto">
    <div class="max-w-6xl mx-auto">
      <h2 class="font-heading text-4xl lg:text-5xl text-center text-gray-800 mb-12">Our Love Story</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-12">
        <div class="space-y-6">
          <StoryCard :title="leftCards[0].title" :text="leftCards[0].text" bg-class="bg-pink-50" />
          <StoryCard :title="leftCards[1].title" :text="leftCards[1].text" bg-class="bg-purple-50" />
        </div>

        <ImageGrid :images="images" />
      </div>
    </div>
  </section>
</template>

<script setup>

import StoryCard from "@/components/invitations/wedding/sunsetGlass/StoryCard.vue";
import ImageGrid from "@/components/invitations/wedding/sunsetGlass/ImageGrid.vue";

defineProps({
  leftCards: { type: Array, default: () => [] }, // [{title,text},{title,text}]
  images: { type: Array, default: () => [] },    // [{src,alt,className}]
});
</script>
