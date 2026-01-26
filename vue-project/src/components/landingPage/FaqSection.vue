<template>
  <SectionWrap>
    <SectionHeader center eyebrow="FAQ" title="Frequently Asked Questions" />
    <div class="container">
      <div class="accordion mt-24">
        <div class="accordion__item" v-for="(f, i) in faqs" :key="i">
          <div class="accordion__header" @click="toggle(i)">
            <h4 class="accordion__title">{{ f.q }}</h4>
            <span class="accordion__icon">{{ openIndex === i ? '−' : '+' }}</span>
          </div>
          <div v-if="openIndex === i" class="accordion__panel">
            {{ f.a }}
          </div>
        </div>
      </div>
    </div>
  </SectionWrap>
</template>

<script setup>
import { ref } from 'vue'
import SectionWrap from '@/components/ui/SectionWrap.vue'
import SectionHeader from '@/components/ui/SectionHeader.vue'

const faqs = [
  { q: 'Can I share my invitation on social media?', a: 'Yes, you can share via link on any platform, plus download a QR code.' },
  { q: 'Do you have free templates?', a: 'We offer a selection of free templates and premium options for Pro plans.' },
  { q: 'Can I track RSVPs?', a: 'Yes, you can view responses in real time and export the guest list.' },
]

const openIndex = ref(-1)
const toggle = (i) => {
  openIndex.value = openIndex.value === i ? -1 : i
}
</script>

<style scoped>
@import '@/assets/styles/accordion.css';
@import '@/assets/styles/utilities.css';
</style>
