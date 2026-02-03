<template>
  <article class="card testimonial">
    <div class="card__body">
      <p class="testimonial__quote">“<slot>{{ quote }}</slot>”</p>
      <div class="flex items-center gap-12 mt-16">
        <img v-if="avatar" :src="avatar" :alt="author" style="width:40px;height:40px;border-radius:50%;object-fit:cover" />
        <div>
          <div class="testimonial__author">{{ author }}</div>
          <div class="card__subtitle">{{ role }}</div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
const props = defineProps({
  quote: { type: String, default: '' },
  author: { type: String, required: true },
  role: { type: String, default: '' },
  avatar: { type: String, default: '' },
})
</script>

<style scoped>
@import '@/assets/styles/cards.css';
@import '@/assets/styles/utilities.css';
</style>
