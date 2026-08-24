<template>
  <SitePage>
    <section class="packagesHero">
      <p class="tag">{{ $t('packages.heroEyebrow') }}</p>
      <h1>
        {{ $t('packages.heroTitle') }}<br>
        <em>{{ $t('packages.heroAccent') }}</em>
      </h1>
      <p>{{ $t('packages.heroLead') }}</p>
    </section>

    <PackagesSection />
  </SitePage>
</template>

<script setup>
import SitePage from "@/layouts/SitePage.vue";
import PackagesSection from "@/components/landingPage/PackagesSection.vue";
</script>
