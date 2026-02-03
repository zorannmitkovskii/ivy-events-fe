<template xmlns="http://www.w3.org/1999/html">
  <Header/>
  <DetailsLayout>
    <div class="space-y-16">
      <!-- HERO CAROUSEL -->
      <HeroVideoSection/>
      <!-- TRENDING TEMPLATES -->
      <WeddingTemplatesCarousel
        :title="$t('weddingsPage.templates.title')"
        :subtitle="$t('weddingsPage.templates.subtitle')"
        :items="[
    {id:1,image:'https://picsum.photos/id/101/800/600',name:'Golden'},
    {id:2,image:'https://picsum.photos/id/102/800/600',name:'Modern'},
    {id:3,image:'https://picsum.photos/id/103/800/600',name:'Classic'},
    {id:4,image:'https://picsum.photos/id/103/800/600',name:'Classic'},
    {id:5,image:'https://picsum.photos/id/103/800/600',name:'Classic'},
    {id:6,image:'https://picsum.photos/id/103/800/600',name:'Classic'},
  ]"
      />
      <!-- Packages with toggle -->
      <WeddingPackages
        :title="$t('weddingsPage.packages.title')"
        @choose="console.log($event)"
      />
      <!-- WHAT IS INCLUDED -->
      <WeddingIncludes/>
      <!-- FAQ -->
      <WeddingFaq/>
      <!-- Feedback -->
      <WeddingFeedback/>

    </div>
  </DetailsLayout>
  <Footer/>
  <router-view/>
</template>

<script setup>
import WeddingHeroCarousel from "@/components/wedding/WeddingHeroCarousel.vue"
import WeddingTemplatesCarousel from "@/components/wedding/WeddingTemplatesCarousel.vue"
import WeddingPackages from "@/components/wedding/WeddingPackages.vue"
import WeddingIncludes from "@/components/wedding/WeddingIncludes.vue"
import WeddingFaq from "@/components/wedding/WeddingFaq.vue"
import WeddingFeedback from "@/components/wedding/WeddingFeedback.vue"
import Header from "@/components/header/Header.vue";
import DetailsLayout from "@/components/DetailsLayout.vue";
import HeroVideoSection from "@/components/wedding/HeroVideoSection.vue";
</script>

<style scoped>
</style>
