<template>
  <div class="about-page">
    <Header />

    <!-- Hero -->
    <section class="about-hero">
      <h1 class="about-hero__title">{{ $t('about.title') }}</h1>
      <p class="about-hero__subtitle">{{ $t('about.heroSubtitle') }}</p>
    </section>

    <!-- Mission & Vision -->
    <section class="about-section">
      <div class="about-grid">
        <div class="about-card">
          <h2 class="about-card__title">{{ $t('about.missionTitle') }}</h2>
          <p class="about-card__text">{{ $t('about.missionText') }}</p>
        </div>
        <div class="about-card">
          <h2 class="about-card__title">{{ $t('about.visionTitle') }}</h2>
          <p class="about-card__text">{{ $t('about.visionText') }}</p>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="about-section about-section--alt">
      <h2 class="about-section__title">{{ $t('about.valuesTitle') }}</h2>
      <div class="values-grid">
        <div class="value-card">
          <h3 class="value-card__title">{{ $t('about.valueSimplicity') }}</h3>
          <p class="value-card__text">{{ $t('about.valueSimplicityDesc') }}</p>
        </div>
        <div class="value-card">
          <h3 class="value-card__title">{{ $t('about.valueElegance') }}</h3>
          <p class="value-card__text">{{ $t('about.valueEleganceDesc') }}</p>
        </div>
        <div class="value-card">
          <h3 class="value-card__title">{{ $t('about.valueInclusion') }}</h3>
          <p class="value-card__text">{{ $t('about.valueInclusionDesc') }}</p>
        </div>
      </div>
    </section>

    <Footer />
  </div>
</template>

<script setup>
import Header from "@/components/header/Header.vue";
import Footer from "@/components/layout/Footer.vue";
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.about-hero {
  text-align: center;
  padding: 80px 24px 56px;
  background: linear-gradient(135deg, var(--neutral-50, #f9fafb) 0%, var(--bg-white, #fff) 100%);
}

.about-hero__title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--brand-dark, #2f3e36);
  margin: 0 0 16px;
}

.about-hero__subtitle {
  font-size: 1.125rem;
  color: var(--neutral-600, #4b5563);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.about-section {
  max-width: 960px;
  margin: 0 auto;
  padding: 56px 24px;
}

.about-section--alt {
  max-width: 100%;
  background: var(--neutral-50, #f9fafb);
  text-align: center;
}

.about-section--alt .about-section__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--brand-dark, #2f3e36);
  margin: 0 0 36px;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
}

.about-card {
  background: var(--bg-white, #fff);
  border: 1px solid var(--neutral-200, #e5e7eb);
  border-radius: 16px;
  padding: 32px;
}

.about-card__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--brand-dark, #2f3e36);
  margin: 0 0 12px;
}

.about-card__text {
  font-size: 1rem;
  color: var(--neutral-600, #4b5563);
  line-height: 1.6;
  margin: 0;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px;
}

.value-card {
  background: var(--bg-white, #fff);
  border: 1px solid var(--neutral-200, #e5e7eb);
  border-radius: 16px;
  padding: 28px 24px;
}

.value-card__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--brand-dark, #2f3e36);
  margin: 0 0 8px;
}

.value-card__text {
  font-size: 0.9375rem;
  color: var(--neutral-600, #4b5563);
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 768px) {
  .about-hero {
    padding: 48px 20px 36px;
  }

  .about-hero__title {
    font-size: 1.75rem;
  }

  .about-hero__subtitle {
    font-size: 1rem;
  }

  .about-section {
    padding: 36px 20px;
  }

  .about-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .about-card {
    padding: 24px;
  }

  .values-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 0 20px;
  }

  .about-section--alt .about-section__title {
    font-size: 1.375rem;
    margin-bottom: 24px;
  }

  .value-card {
    padding: 24px 20px;
  }
}
</style>
