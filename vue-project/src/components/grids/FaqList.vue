<template>
  <div class="faq-list">
    <FaqItem
      v-for="(item, idx) in faqItems"
      :key="idx"
      :question="item.question"
      :answer="item.answer"
      :isOpen="openIndex === idx"
      @toggle="toggle(idx)"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import FaqItem from "@/components/cards/FaqItem.vue";
import { t } from '@/i18n'

const props = defineProps({
  defaultOpenIndex: { type: Number, default: 0 } // first open like screenshot
});

const openIndex = ref(props.defaultOpenIndex);
const faqItems = [
  {
    question: t('home.faq.items.q1.question'),
    answer: t('home.faq.items.q1.answer')
  },
  {
    question: t('home.faq.items.q2.question'),
    answer: t('home.faq.items.q2.answer')
  },
  {
    question: t('home.faq.items.q3.question'),
    answer: t('home.faq.items.q3.answer')
  },
  {
    question: t('home.faq.items.q4.question'),
    answer: t('home.faq.items.q4.answer')
  },
  {
    question: t('home.faq.items.q5.question'),
    answer: t('home.faq.items.q5.answer')
  },
  {
    question: t('home.faq.items.q6.question'),
    answer: t('home.faq.items.q6.answer')
  },
  {
    question: t('home.faq.items.q7.question'),
    answer: t('home.faq.items.q7.answer')
  }
];
function toggle(idx) {
  openIndex.value = openIndex.value === idx ? -1 : idx;
}
</script>

<style scoped>
.faq-list {
  display: grid;
  gap: 18px;
}
</style>
