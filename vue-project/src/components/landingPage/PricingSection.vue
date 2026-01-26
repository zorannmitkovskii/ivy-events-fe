<template>
  <SectionWrap>
    <SectionHeader center eyebrow="Pricing" title="Simple, transparent plans" subtitle="Choose the plan that fits your event needs." />
    <div class="container">
      <div class="grid grid--3 mt-24">
        <PricingCard title="Starter" price="$0" subtitle="For small events" :features="['Basic templates','Share via link']" />
        <PricingCard title="Pro" price="$9/mo" subtitle="Most popular" :features="['All templates','Custom branding','Analytics']" />
        <PricingCard title="Business" price="$29/mo" subtitle="Teams & brands" :features="['Everything in Pro','Team collaboration','Priority support']" />
      </div>
    </div>
  </SectionWrap>
</template>

<script setup>
import SectionWrap from '@/components/ui/SectionWrap.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import PricingCard from '@/components/cards/PricingCard.vue'
</script>

<style scoped>
@import '@/assets/styles/sections.css';
</style>
