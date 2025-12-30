<template>
  <section class="wedding-wrapper">
    <WeddingTimeline />

    <WeddingCards />
  </section>
</template>

<script setup>
import WeddingTimeline from "./WeddingTimeline.vue";
import WeddingCards from "./WeddingCards.vue";
</script>

<style scoped>
.wedding-wrapper {
  background: #4a664c;
  min-height: 100vh;
  padding: 60px 20px;
  color: white;
  text-align: center;
}
</style>
