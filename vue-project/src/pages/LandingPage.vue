<template>
  <!-- Show ComingSoon on prod, and also on local where we show everything -->
  <ComingSoon v-if="isProd || isLocal" />

  <!-- Show the rest of landing sections on test, and also on local -->
  <template v-if="isTest || isLocal">
    <Header />
    <HeroSection />
    <div class="container mt-5">
      <CategoriesCarousel />
      <HowItWorks />
      <ShareAnywhere />
      <PackageSection />
      <!--    <FeaturedOrganizers />-->
      <!--    <TestimonialsCarousel />-->
      <Faq/>
    </div>
    <Footer />
  </template>

  <router-view />
</template>

<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
import Header from '@/components/header/Header.vue'
import Footer from '@/components/footer/Footer.vue'
import HeroSection from "@/components/landingPage/HeroSection.vue";
import CategoriesCarousel from "@/components/landingPage/CategoriesCarousel.vue";
import HowItWorks from "@/components/landingPage/HowItWorks.vue";
import FeaturedOrganizers from "@/components/landingPage/FeaturedOrganizers.vue";
import TestimonialsCarousel from "@/components/landingPage/TestimonialsCarousel.vue";
import Faq from "@/components/landingPage/Faq.vue";
import ShareAnywhere from "@/components/landingPage/ShareAnywhere.vue";
import PackageSection from "@/components/landingPage/PackageSection.vue";
import { detectDefaultEnvFromLocation } from '@/services/env'

// Read APP_ENV injected at runtime via window.__ENV__ (default intelligently based on host)
const env = (typeof window !== 'undefined' && window.__ENV__) || {};

function isUnresolvedTemplate(val) {
  return typeof val === 'string' && /\$\{[^}]+\}/.test(val);
}

const rawAppEnv = env.APP_ENV;
const appEnv = isUnresolvedTemplate(rawAppEnv)
  ? detectDefaultEnvFromLocation()
  : String(rawAppEnv || detectDefaultEnvFromLocation()).toLowerCase();

const isProd = appEnv === 'prod' || appEnv === 'production';
const isTest = appEnv === 'test' || appEnv === 'testing' || appEnv === 'dev' || appEnv === 'development';
const isLocal = appEnv === 'local';
</script>

<style scoped>
</style>
