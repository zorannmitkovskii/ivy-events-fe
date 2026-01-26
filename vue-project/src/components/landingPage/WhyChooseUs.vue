<template>
  <SectionWrap>
    <SectionHeader center eyebrow="Why Ivy" title="Why choose us" subtitle="We obsess over the details so you don't have to." />
    <div class="container">
      <div class="grid grid--3 mt-24">
        <BenefitItem title="Beautiful by default" description="Modern, accessible designs that look great everywhere.">
          <template #icon>🎨</template>
        </BenefitItem>
        <BenefitItem title="Frictionless sharing" description="One link works across devices and platforms.">
          <template #icon>🔗</template>
        </BenefitItem>
        <BenefitItem title="Fast and reliable" description="Backed by scalable infrastructure.">
          <template #icon>⚡</template>
        </BenefitItem>
      </div>
    </div>
  </SectionWrap>
</template>

<script setup>
import SectionWrap from '@/components/ui/SectionWrap.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import BenefitItem from '@/components/cards/BenefitItem.vue'
</script>

<style scoped>
@import '@/assets/styles/sections.css';
</style>
