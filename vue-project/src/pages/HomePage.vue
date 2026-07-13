<template>
  <JsonLd :schema="landingSchemas" id="landing-jsonld" />
  <Header />
  <HeroSection />
  <HowItWorks />
  <EventCategories bgClass="bg-main" v-model="selectedCategory" />
  <TemplatesGallery id="templates" />
  <CoreFeatures id="features" />
  <PackagesSection id="pricing" />
  <SocialProof />
  <FinalCtaSection />
  <HomepageFaq />
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
import Footer from "@/components/layout/Footer.vue";
import TemplatesGallery from "@/components/landingPage/TemplatesGallery.vue";
import { setSelectedCategory } from '@/store/onboarding.store';
import { categoryIdToEnum } from '@/helper/CategoryMapping.helper.js';
import FinalCtaSection from "@/components/landingPage/FinalCtaSection.vue";
import HomepageFaq from "@/components/landingPage/HomepageFaq.vue";
import SocialProof from "@/components/landingPage/SocialProof.vue";
import JsonLd from "@/components/seo/JsonLd.vue";
import { organizationSchema, webSiteSchema, DEFAULT_BASE_URL } from "@/utils/jsonLdSchemas";

const landingSchemas = computed(() => [
  organizationSchema({
    logo: `${DEFAULT_BASE_URL}/logo.svg`,
    description: 'Digital event invitations, RSVP management, and event planning platform.',
  }),
  webSiteSchema({
    searchUrlTemplate: `${DEFAULT_BASE_URL}/${lang.value}/event-invitations?q={search_term_string}`,
  }),
]);

const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');
const selectedCategory = ref(null);

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
