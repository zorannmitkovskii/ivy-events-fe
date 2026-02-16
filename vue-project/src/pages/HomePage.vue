<template>
  <!-- Show ComingSoon on prod, and also on local where we show everything -->
  <ComingSoon v-if="isProd" />

  <!-- Show the rest of landing sections on test, and also on local -->
  <template v-if="isTest || isLocal">
    <Header />
    <HeroSection />
    <SocialProofStrip />
    <EventCategories bgClass="bg-white"/>
    <HowItWorks />
    <CoreFeatures id="features" />
    <TemplatesGallery id="templates" />
    <PricingSection id="pricing" />
    <WhyChooseUs />
    <TestimonialsSection />
    <FaqSection id="faq" />
    <FinalCtaSection />
    <Footer />
  </template>

  <router-view />
</template>

<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
import Header from '@/components/header/Header.vue'
import HeroSection from "@/components/landingPage/HeroSection.vue";
import SocialProofStrip from "@/components/landingPage/SocialProofStrip.vue";
import HowItWorks from "@/components/landingPage/HowItWorks.vue";
import { detectDefaultEnvFromLocation } from '@/services/env'
import EventCategories from "@/components/landingPage/EventCategories.vue";
import CoreFeatures from "@/components/landingPage/CoreFeatures.vue";
import PricingSection from "@/components/landingPage/PricingSection.vue";
import WhyChooseUs from "@/components/landingPage/WhyChooseUs.vue";
import TestimonialsSection from "@/components/landingPage/TestimonialsSection.vue";
import FaqSection from "@/components/landingPage/FaqSection.vue";
import FinalCtaSection from "@/components/landingPage/FinalCtaSection.vue";
import Footer from "@/components/layout/Footer.vue";
import TemplatesGallery from "@/components/landingPage/TemplatesGallery.vue";

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
