<template>
  <main class="category-page">
    <!-- Fixed header -->
    <header class="sticky-header">
      <div class="header-inner">
        <button class="back-btn" @click="onBack" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="header-center">
          <h1 class="header-title">{{ $t('onboarding.category.title') }}</h1>
          <p class="header-subtitle">{{ $t('onboarding.category.subtitle') }}</p>
        </div>

        <ButtonMain
          :label="$t('onboarding.category.continue')"
          variant="main"
          :disabled="!selectedCategoryId"
          @click="onContinue"
        />
      </div>
    </header>

    <!-- Scrollable content -->
    <div class="content">
      <EventCategories
        v-model="selectedCategoryId"
        bg-class="bg-transparent"
        :show-header="false"
        :disable-navigation="true"
      />
    </div>

    <OnboardingFooterLinks />
  </main>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ButtonMain from '@/components/generic/ButtonMain.vue';
import OnboardingFooterLinks from '@/components/onboarding/OnboardingFooterLinks.vue';
import { setSelectedCategory, onboardingStore } from '@/store/onboarding.store';
import EventCategories from "@/components/landingPage/EventCategories.vue";
import {categoryIdToEnum, enumToCategoryId} from "@/helper/CategoryMapping.helper.js";

const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');

// Initialize with stored category (convert enum to ID for the component)
const selectedCategoryId = ref(
  onboardingStore.selectedCategory
    ? enumToCategoryId(onboardingStore.selectedCategory)
    : null
);

// Watch for selection changes and sync to store
watch(selectedCategoryId, (newId) => {
  if (newId) {
    const enumValue = categoryIdToEnum(newId);
    if (enumValue) {
      setSelectedCategory(enumValue);
    }
  }
});

function onBack() {
  router.push({ name: 'home', params: { lang: lang.value } });
}

async function onContinue() {
  if (!selectedCategoryId.value) return;

  // Ensure the enum is stored (should already be from watch)
  const enumValue = categoryIdToEnum(selectedCategoryId.value);
  if (enumValue) {
    setSelectedCategory(enumValue);
  }

  await router.push({ name: 'EventBasicDetailsPage', params: { lang: lang.value } });
}
</script>

<style scoped>
.category-page {
  min-height: 100vh;
  background: var(--bg-main, #f9fafb);
  display: flex;
  flex-direction: column;
}

/* ===== Fixed header ===== */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid rgba(16, 24, 40, 0.08);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(16, 24, 40, 0.1);
  background: #fff;
  color: var(--neutral-700, #374151);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.back-btn:hover {
  background: var(--bg-main, #f9fafb);
  border-color: rgba(16, 24, 40, 0.18);
}

.header-center {
  flex: 1;
  min-width: 0;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900, #111827);
  line-height: 1.3;
}

.header-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--neutral-500, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== Scrollable content ===== */
.content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 40px;
}

/* ===== Responsive ===== */
@media (max-width: 640px) {
  .header-inner {
    padding: 10px 16px;
  }

  .header-subtitle {
    display: none;
  }

  .header-title {
    font-size: 16px;
  }

  .content {
    padding: 16px 16px 32px;
  }
}
</style>
