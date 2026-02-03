<template>
  <section class="faq-section" :id="id">
    <div class="container">
      <header class="section-header">
        <h2 class="section-title">{{ $t('home.faq.title') }}</h2>
        <p class="section-subtitle">{{ $t('home.faq.subtitle') }}</p>
      </header>

      <div class="faq-wrap">
        <FaqList :defaultOpenIndex="defaultOpenIndex" />
      </div>
    </div>
  </section>
</template>

<script setup>
import FaqList from "@/components/grids/FaqList.vue";

const props = defineProps({
  id: { type: String, default: 'faq' },
  defaultOpenIndex: { type: Number, default: 0 }
});
</script>

<style scoped>
.faq-section {
  padding: 6rem 0;
  background: var(--bg-white);
}

.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 24px;
}

.section-header {
  text-align: center;
  margin-bottom: 36px;
}

.section-title {
  margin: 0 0 10px;
  font-family: var(--font-family), serif;
  font-size: 44px;
  font-weight: 500;
  color: var(--neutral-900);
}

.section-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--neutral-700);
}

.faq-wrap {
  max-width: 860px; /* like screenshot */
  margin: 0 auto;
}
</style>
