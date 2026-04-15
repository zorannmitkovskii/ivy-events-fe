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
import { ref, onMounted } from "vue";
import FaqItem from "@/components/cards/FaqItem.vue";
import { faqService } from "@/services/faq.service";
import { useI18n } from 'vue-i18n';

const { tm } = useI18n();

const props = defineProps({
  defaultOpenIndex: { type: Number, default: 0 }
});

const openIndex = ref(props.defaultOpenIndex);

const i18nFallback = tm('faqPageFaqs') || [];
const faqItems = ref(i18nFallback.length ? i18nFallback : []);

onMounted(async () => {
  try {
    const data = await faqService.listActive();
    if (Array.isArray(data) && data.length > 0) {
      faqItems.value = data;
    }
  } catch {
    // keep i18n fallback
  }
});

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
