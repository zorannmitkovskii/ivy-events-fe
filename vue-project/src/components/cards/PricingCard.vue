<template>
  <article class="card">
    <div class="card__body">
      <h3 class="card__title">{{ title }}</h3>
      <div class="price mt-16">{{ price }}</div>
      <p class="card__subtitle" v-if="subtitle">{{ subtitle }}</p>
      <ul class="mt-16">
        <li v-for="(f, i) in features" :key="i">✔️ {{ f }}</li>
      </ul>
      <div class="mt-16">
        <AppButton>Choose Plan</AppButton>
      </div>
    </div>
  </article>
</template>

<script setup>
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps({
  title: { type: String, required: true },
  price: { type: String, required: true },
  subtitle: { type: String, default: '' },
  features: { type: Array, default: () => [] },
})
</script>

<style scoped>
@import '@/assets/styles/cards.css';
@import '@/assets/styles/utilities.css';
</style>
