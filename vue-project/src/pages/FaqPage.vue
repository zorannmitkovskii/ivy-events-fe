<template>
  <div>
    <Header />
    <div class="faq-page">
      <FaqSection />
    </div>
    <Footer />
  </div>
</template>

<script setup>
import Header from "@/components/header/Header.vue";
import Footer from "@/components/layout/Footer.vue";
import FaqSection from "@/components/landingPage/FaqSection.vue";
</script>

<style scoped>
.faq-page {
  min-height: 100vh;
  background: var(--bg-white);
}
</style>
