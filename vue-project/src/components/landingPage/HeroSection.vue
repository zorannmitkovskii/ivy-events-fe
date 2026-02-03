<!-- src/components/sections/HeroSection.vue -->
<template>
  <section class="hero">
    <div class="container hero-inner">
      <!-- Left -->
      <div class="hero-content">
        <h1 class="hero-title">
          {{ $t('home.hero.titleLine1') }}<br />
          {{ $t('home.hero.titleLine2') }}<br />
          {{ $t('home.hero.titleLine3') }}
        </h1>

        <p class="hero-subtitle">
          {{ $t('home.hero.subtitle') }}
        </p>

        <div class="d-flex gap-3 flex-wrap">
          <ButtonMain
            :label="$t('home.hero.primaryCta')"
            :to="primaryTo"
            variant="main"
          />
          <ButtonMain
            :label="$t('home.hero.secondaryCta')"
            :to="secondaryTo"
            variant="outline"
          />
        </div>
      </div>

      <!-- Right -->
      <div class="hero-media">
        <img
          class="hero-image"
          :src="imageSrc"
          :alt="imageAlt"
          loading="lazy"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import ButtonMain from "@/components/generic/ButtonMain.vue";

defineProps({
  imageSrc: {
    type: String,
    default:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=900&fit=crop"
  },
  imageAlt: {
    type: String,
    default: "Wedding couple"
  },
  primaryTo: {
    type: [String, Object],
    default: "/invitation/create"
  },
  secondaryTo: {
    type: [String, Object],
    default: "/templates"
  }
});
</script>

<style scoped>
.hero {
  padding: 6rem 0;
  background: var(--soft-light);
  background: linear-gradient(135deg, #F7F5F0 0%, #FFFFFF 100%);
}

.hero-inner {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  align-items: center;
  gap: 64px;
}

.hero-title {
  margin: 0 0 18px;
  font-weight: 500;
  letter-spacing: -0.6px;
  color: var(--brand-main);
  font-size: 72px;
  line-height: 1.05;
}

.hero-subtitle {
  margin: 0 0 28px;
  max-width: 520px;
  color: var(--neutral-700);
  font-size: 18px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

/* Right image */
.hero-media {
  display: flex;
  justify-content: center;
}

.hero-image {
  width: 100%;
  max-width: 640px;
  height: 380px;
  object-fit: cover;
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.14);
}

/* Responsive */
@media (max-width: 992px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .hero-title {
    font-size: 56px;
  }

  .hero-image {
    height: 340px;
    max-width: 100%;
  }
}

@media (max-width: 520px) {
  .hero {
    padding: 4rem 0;
  }

  .hero-title {
    font-size: 44px;
  }

  .hero-subtitle {
    font-size: 16px;
  }
}
</style>
