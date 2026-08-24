<template>
  <!--
    The 2026 landing page, in the redesign's order: the invitation first, then
    what the product does, then what it looks like, then the planner, then
    proof, then the offer.

    `.ivy-site` is what puts the whole page inside the redesign's stylesheet —
    see `assets/styles/ivy/site.css`. Every public page carries it.
  -->
  <div class="ivy-site">
    <Header />
    <main>
      <HeroSection />
      <HowItWorks />
      <TemplatesGallery id="templates" />
      <EventCategories bg-class="bg-white" v-model="selectedCategory" />
      <CoreFeatures id="features" />
      <QuoteSection />
      <PackagesSection id="pricing" />
      <HomepageFaq />
      <FinalCtaSection />
    </main>
    <Footer />
    <router-view />
  </div>
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
import Footer from "@/components/layout/Footer.vue";
import TemplatesGallery from "@/components/landingPage/TemplatesGallery.vue";
import QuoteSection from "@/components/landingPage/QuoteSection.vue";
import { setSelectedCategory } from '@/store/onboarding.store';
import { categoryIdToEnum } from '@/helper/CategoryMapping.helper.js';
import FinalCtaSection from "@/components/landingPage/FinalCtaSection.vue";
import HomepageFaq from "@/components/landingPage/HomepageFaq.vue";
import { useReveal } from "@/composables/useReveal";

const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');
const selectedCategory = ref(null);

// One sweep after the page mounts catches every `.reveal` on it; the sections
// that load data asynchronously re-run it themselves once their cards exist.
useReveal();

watch(selectedCategory, async (newId) => {
  if (newId) {
    const enumValue = categoryIdToEnum(newId);
    if (enumValue) {
      setSelectedCategory(enumValue);
      if (newId === 'gallery') {
        await router.push({ name: 'signup', params: { lang: lang.value } });
      } else {
        await router.push({ name: 'EventInvitationsPage', params: { lang: lang.value } });
      }
    }
    selectedCategory.value = null;
  }
});
</script>
