<template>
  <section class="py-16 lg:py-20 px-6 gradient-bg max-h-[900px] overflow-auto">
    <div class="max-w-4xl mx-auto">
      <h2 class="font-heading text-4xl lg:text-5xl text-center text-gray-800 mb-12">Wedding Day Timeline</h2>

      <div class="space-y-6">
        <TimelineItem
          v-for="(it, idx) in items"
          :key="idx"
          :time="it.time"
          :title="it.title"
          :description="it.description"
          :badge-class="it.badgeClass"
        />
      </div>
    </div>
  </section>
</template>

<script setup>

import TimelineItem from "@/components/invitations/wedding/sunsetGlass/TimelineItem.vue";

defineProps({
  items: { type: Array, default: () => [] },
});
</script>
