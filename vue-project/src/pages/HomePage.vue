<template>
  <!--
    The landing page, in the standalone mockup's order: pick a category from
    the turning deck, see the designs, see finished invitations, learn how long
    it takes, see what a guest gets, see what happens after it is sent, read the
    claim, then price, proof and offer.

    It renders its own shell rather than using `SitePage` because the hero has
    to sit directly under the header with no wrapper between them, and because
    the nested `router-view` for the invitation preview belongs inside the
    scope. `.ivy-site` is that scope — see `assets/styles/ivy/site.css`.
  -->
  <div class="ivy-site">
    <a class="skip" href="#main">{{ $t('a11y.skipToContent') }}</a>
    <Header />
    <main id="main">
      <HeroCarousel />
      <EventCategories v-model="selectedCategory" />
      <DemoShowcase />
      <HowItWorks />
      <GuestExperience />
      <PlannerTabs />
      <StatementStats />
      <PackagesSection />
      <BlogTeaser />
      <HomepageFaq />
      <FinalCtaSection />
    </main>
    <Footer />
    <router-view />
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Header from '@/components/header/Header.vue'
import Footer from '@/components/layout/Footer.vue'
import HeroCarousel from '@/components/landingPage/HeroCarousel.vue'
import EventCategories from '@/components/landingPage/EventCategories.vue'
import DemoShowcase from '@/components/landingPage/DemoShowcase.vue'
import HowItWorks from '@/components/landingPage/HowItWorks.vue'
import GuestExperience from '@/components/landingPage/GuestExperience.vue'
import PlannerTabs from '@/components/landingPage/PlannerTabs.vue'
import StatementStats from '@/components/landingPage/StatementStats.vue'
import PackagesSection from '@/components/landingPage/PackagesSection.vue'
import BlogTeaser from '@/components/landingPage/BlogTeaser.vue'
import HomepageFaq from '@/components/landingPage/HomepageFaq.vue'
import FinalCtaSection from '@/components/landingPage/FinalCtaSection.vue'
import { setSelectedCategory } from '@/store/onboarding.store'
import { categoryIdToEnum } from '@/helper/CategoryMapping.helper.js'
import { useReveal } from '@/composables/useReveal'

const router = useRouter()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')
const selectedCategory = ref(null)

// One sweep after the page mounts catches every `.reveal` on it; the sections
// that load data asynchronously re-run it themselves once their cards exist.
useReveal()

/*
  A category card opens the public catalogue, filtered.

  It used to push `EventInvitationsPage`, which is step two of the onboarding
  flow — so a visitor who clicked "Weddings" on the landing page landed inside
  event creation with a back button to nowhere. The pick is still remembered on
  the onboarding store, so it survives if they do go on to sign up.
*/
watch(selectedCategory, async (newId) => {
  if (!newId) return
  const enumValue = categoryIdToEnum(newId)
  if (enumValue) {
    setSelectedCategory(enumValue)
    await router.push({ name: 'designs', params: { lang: lang.value }, query: { category: enumValue } })
  }
  selectedCategory.value = null
})
</script>
