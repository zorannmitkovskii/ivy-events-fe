<template>
  <ComingSoon />
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
</script>

<style scoped>
</style>
