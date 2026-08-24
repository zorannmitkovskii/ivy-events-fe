<template>
  <SitePage>
    <section class="pagehero">
      <p class="tag">{{ $t('faq.heroEyebrow') }}</p>
      <h1>
        {{ $t('faq.heroTitle') }}<br>
        <em>{{ $t('faq.heroAccent') }}</em>
      </h1>
      <p>{{ $t('faq.heroLead') }}</p>
    </section>

    <section class="faqlist">
      <article
        v-for="(item, idx) in faqs"
        :key="idx"
        :class="{ open: openIdx === idx }"
      >
        <button
          type="button"
          :aria-expanded="openIdx === idx ? 'true' : 'false'"
          @click="toggle(idx)"
        >
          <span>{{ item.question }}</span>
          <b aria-hidden="true">{{ openIdx === idx ? '−' : '+' }}</b>
        </button>
        <p>{{ item.answer }}</p>
      </article>
    </section>
  </SitePage>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import SitePage from "@/layouts/SitePage.vue";

const { tm } = useI18n();
const faqs = tm("faqPageFaqs") || [];
const openIdx = ref(0);

function toggle(idx) {
  openIdx.value = openIdx.value === idx ? -1 : idx;
}
</script>

<style scoped>
/*
  The design caps an open answer at 180px so the panel can transition — a
  height has to be a number for that. Several of these answers are six lines
  long, so the ceiling is raised to clear the longest rather than clipping it
  mid-sentence.
*/
.faqlist article.open > p {
  max-height: 460px;
}
</style>
