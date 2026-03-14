<template>
  <Header />
  <HeroSection />
  <HowItWorks />
  <EventCategories bgClass="bg-main" v-model="selectedCategory" />
  <TemplatesGallery id="templates" />
  <CoreFeatures id="features" />
  <PackagesSection id="pricing" />
  <TestimonialsSection />
  <FinalCtaSection />
  <Footer />
  <router-view />
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Header from '@/components/header/Header.vue'
import HeroSection from "@/components/landingPage/HeroSection.vue";
import HowItWorks from "@/components/landingPage/HowItWorks.vue";
import EventCategories from "@/components/landingPage/EventCategories.vue";
import CoreFeatures from "@/components/landingPage/CoreFeatures.vue";
import PackagesSection from "@/components/landingPage/PackagesSection.vue";
import TestimonialsSection from "@/components/landingPage/TestimonialsSection.vue";
import FinalCtaSection from "@/components/landingPage/FinalCtaSection.vue";
import Footer from "@/components/layout/Footer.vue";
import TemplatesGallery from "@/components/landingPage/TemplatesGallery.vue";
import { setSelectedCategory } from '@/store/onboarding.store';
import { categoryIdToEnum } from '@/helper/CategoryMapping.helper.js';

const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');
const selectedCategory = ref(null);

watch(selectedCategory, async (newId) => {
  if (newId) {
    const enumValue = categoryIdToEnum(newId);
    if (enumValue) {
      setSelectedCategory(enumValue);
      await router.push({ name: 'EventInvitationsPage', params: { lang: lang.value } });
    }
    selectedCategory.value = null;
  }
});
</script>
