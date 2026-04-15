<template>
  <section class="faq-section" id="faq">
    <div class="faq-container">
      <h2 class="faq-title">{{ t('home.faq.title') }}</h2>
      <p class="faq-subtitle">{{ t('home.faq.subtitle') }}</p>

      <div class="faq-list">
        <div
          v-for="(item, idx) in faqs"
          :key="idx"
          class="faq-item"
          :class="{ 'faq-item--open': openIdx === idx }"
        >
          <button class="faq-question" @click="toggle(idx)">
            <span>{{ item.question }}</span>
            <svg class="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div v-if="openIdx === idx" class="faq-answer">
            <p>{{ item.answer }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { tm, t } = useI18n();
const faqs = tm('homepageFaqs') || [];
const openIdx = ref(null);

function toggle(idx) {
  openIdx.value = openIdx.value === idx ? null : idx;
}
</script>

<style scoped>
.faq-section {
  padding: 80px 24px;
  background: var(--bg-main, #faf8f4);
}

.faq-container {
  max-width: 740px;
  margin: 0 auto;
}

.faq-title {
  font-family: 'Playfair Display', serif;
  font-size: 36px;
  font-weight: 500;
  text-align: center;
  color: var(--neutral-900, #1a1a1a);
  margin: 0 0 8px;
}

.faq-subtitle {
  text-align: center;
  font-size: 15px;
  color: var(--neutral-500, #6b7280);
  margin: 0 0 48px;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.faq-item {
  border-bottom: 1px solid var(--neutral-200, #e5e7eb);
}

.faq-item:first-child {
  border-top: 1px solid var(--neutral-200, #e5e7eb);
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 20px 0;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  color: var(--neutral-900, #1a1a1a);
  text-align: left;
  transition: color 0.15s;
}

.faq-question:hover {
  color: var(--brand-main, #5a7a52);
}

.faq-chevron {
  flex-shrink: 0;
  transition: transform 0.25s;
  color: var(--neutral-400, #9ca3af);
}

.faq-item--open .faq-chevron {
  transform: rotate(180deg);
  color: var(--brand-main, #5a7a52);
}

.faq-answer {
  padding: 0 0 20px;
}

.faq-answer p {
  font-size: 15px;
  line-height: 1.7;
  color: var(--neutral-600, #4b5563);
  margin: 0;
}

@media (max-width: 640px) {
  .faq-section { padding: 56px 16px; }
  .faq-title { font-size: 28px; }
  .faq-question { font-size: 15px; }
}
</style>
