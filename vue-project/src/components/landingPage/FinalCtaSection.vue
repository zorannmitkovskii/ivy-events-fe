<template>
  <section class="cta">
    <div class="cta__content">
      <h2 class="cta__title">
        {{ $t('home.finalCta.title') }}
      </h2>

      <p class="cta__subtitle">
        {{ $t('home.finalCta.subtitle') }}
      </p>

      <div class="cta__actions">
        <ButtonMain
            :label="$t('home.finalCta.primaryCta')"
            to="/register"
            variant="outline"
        />
        <ButtonMain
            :label="$t('home.finalCta.secondaryCta')"
            to="/templates"
            variant="secondary"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import ButtonMain from "@/components/generic/ButtonMain.vue";
</script>

<style scoped>
.cta {
  background: linear-gradient(
      135deg,
      var(--brand-main),
      var(--brand-dark)
  );
  padding: 96px 20px;
  text-align: center;
  color: var(--bg-white);
}

.cta__content {
  max-width: 760px;
  margin: 0 auto;
}

.cta__title {
  font-family: var(--font-family), serif;
  font-size: 40px;
  font-weight: 500;
  margin-bottom: 16px;
}

.cta__subtitle {
  font-size: 18px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 36px;
}

.cta__actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 640px) {
  .cta__title {
    font-size: 30px;
  }

  .cta__subtitle {
    font-size: 16px;
  }
}
</style>
