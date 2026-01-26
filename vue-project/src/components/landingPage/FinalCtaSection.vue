<template>
  <SectionWrap>
    <div class="flex flex-col items-center gap-16 text-center">
      <SectionHeader center eyebrow="Ready to create?" title="Start your first invitation today" subtitle="It's free to try and takes just a few minutes." />
      <div class="flex items-center gap-16">
        <AppButton size="lg">Get Started Free</AppButton>
        <AppButton variant="outline" size="lg">See Pricing</AppButton>
      </div>
    </div>
  </SectionWrap>
</template>

<script setup>
import SectionWrap from '@/components/ui/SectionWrap.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
</script>

<style scoped>
@import '@/assets/styles/utilities.css';
</style>
