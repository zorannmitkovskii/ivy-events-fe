<template>
  <SitePage>
    <section class="page-hero">
      <div class="wrap">
        <h1>{{ $t('packages.heroTitle') }}</h1>
        <p class="lead">{{ $t('packages.heroLead') }}</p>
      </div>
    </section>

    <PackagesSection />
  </SitePage>
</template>

<script setup>
import SitePage from '@/layouts/SitePage.vue'
import PackagesSection from '@/components/landingPage/PackagesSection.vue'
</script>
