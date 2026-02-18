<template>
  <Header />
  <HeroSection />
<!--  <SocialProofStrip />-->
  <EventCategories bgClass="bg-white"/>
  <HowItWorks />
  <CoreFeatures id="features" />
  <TemplatesGallery id="templates" />
  <PackagesSection id="pricing" />
  <WhyChooseUs />
<!--  <TestimonialsSection />-->
  <FaqSection id="faq" />
  <FinalCtaSection />
  <Footer />
  <router-view />
</template>

<script setup>
import Header from '@/components/header/Header.vue'
import HeroSection from "@/components/landingPage/HeroSection.vue";
import SocialProofStrip from "@/components/landingPage/SocialProofStrip.vue";
import HowItWorks from "@/components/landingPage/HowItWorks.vue";
import EventCategories from "@/components/landingPage/EventCategories.vue";
import CoreFeatures from "@/components/landingPage/CoreFeatures.vue";
import PackagesSection from "@/components/landingPage/PackagesSection.vue";
import WhyChooseUs from "@/components/landingPage/WhyChooseUs.vue";
import TestimonialsSection from "@/components/landingPage/TestimonialsSection.vue";
import FaqSection from "@/components/landingPage/FaqSection.vue";
import FinalCtaSection from "@/components/landingPage/FinalCtaSection.vue";
import Footer from "@/components/layout/Footer.vue";
import TemplatesGallery from "@/components/landingPage/TemplatesGallery.vue";
</script>
