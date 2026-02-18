<template>
  <div class="terms-page">
    <Header />

    <section class="terms-content">
      <h1 class="terms-title">{{ $t('terms.title') }}</h1>
      <p class="terms-updated">{{ $t('terms.lastUpdated') }}</p>
      <p class="terms-intro">{{ $t('terms.intro') }}</p>

      <div
        v-for="key in sectionKeys"
        :key="key"
        class="terms-section"
      >
        <h2 class="terms-section__title">{{ $t(`terms.sections.${key}.title`) }}</h2>
        <p class="terms-section__text">{{ $t(`terms.sections.${key}.text`) }}</p>
      </div>
    </section>

    <Footer />
  </div>
</template>

<script setup>
import Header from "@/components/header/Header.vue";
import Footer from "@/components/layout/Footer.vue";

const sectionKeys = [
  "acceptance",
  "services",
  "accounts",
  "payment",
  "content",
  "liability",
  "changes",
  "contact",
];
</script>

<style scoped>
.terms-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.terms-content {
  max-width: 760px;
  margin: 0 auto;
  padding: 56px 24px 80px;
}

.terms-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--brand-dark, #2f3e36);
  margin: 0 0 8px;
}

.terms-updated {
  font-size: 0.875rem;
  color: var(--neutral-400, #9ca3af);
  margin: 0 0 24px;
}

.terms-intro {
  font-size: 1rem;
  color: var(--neutral-600, #4b5563);
  line-height: 1.6;
  margin: 0 0 40px;
}

.terms-section {
  margin-bottom: 32px;
}

.terms-section__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--brand-dark, #2f3e36);
  margin: 0 0 8px;
}

.terms-section__text {
  font-size: 1rem;
  color: var(--neutral-600, #4b5563);
  line-height: 1.7;
  margin: 0;
}

@media (max-width: 768px) {
  .terms-content {
    padding: 36px 16px 60px;
  }

  .terms-title {
    font-size: 1.5rem;
  }

  .terms-intro {
    font-size: 0.9375rem;
    margin-bottom: 28px;
  }

  .terms-section__text {
    font-size: 0.9375rem;
  }
}
</style>
