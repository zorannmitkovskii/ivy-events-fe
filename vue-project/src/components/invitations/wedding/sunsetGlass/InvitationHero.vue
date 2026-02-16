<template>
  <section class="relative flex flex-col lg:flex-row min-h-[600px] lg:h-[700px] max-h-[800px]">
    <div class="w-full lg:w-1/2 h-[400px] lg:h-full">
      <img :src="imageUrl" :alt="coupleName" class="w-full h-full object-cover" />
    </div>

    <div class="w-full lg:w-1/2 h-[500px] lg:h-full gradient-bg flex items-center justify-center p-6 lg:p-12">
      <div class="glass-panel rounded-large shadow-custom p-8 lg:p-12 max-w-md w-full text-center">
        <h1 class="font-heading text-5xl lg:text-6xl text-gray-800 mb-4 text-glow">{{ coupleName }}</h1>
        <div class="w-16 h-0.5 bg-pink-300 mx-auto mb-6"></div>
        <p class="font-body text-xl lg:text-2xl text-gray-700 mb-2">{{ subtitle }}</p>
        <p class="font-heading text-3xl lg:text-4xl text-gray-800 mb-8 text-glow">{{ dateLabel }}</p>
        <p class="font-body text-lg text-gray-600 mb-8" v-html="locationHtml"></p>
        <a
          href="#rsvp"
          class="inline-block bg-pink-300 hover:bg-pink-400 text-white font-body font-semibold px-8 py-4 rounded-small shadow-custom hover:shadow-custom-hover transition-all duration-300"
          @click.prevent="$emit('rsvp-click')"
        >
          {{ ctaLabel }}
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  imageUrl: { type: String, required: true },
  coupleName: { type: String, required: true },
  subtitle: { type: String, default: "are getting married" },
  dateLabel: { type: String, required: true },
  locationHtml: { type: String, default: "" },
  ctaLabel: { type: String, default: "RSVP Now" },
});
defineEmits(["rsvp-click"]);
</script>
