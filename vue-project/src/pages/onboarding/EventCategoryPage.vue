<template>
  <main class="category-page">
    <div class="wrap">
      <h1 class="title">{{ $t('onboarding.category.title') }}</h1>
      <p class="subtitle">{{ $t('onboarding.category.subtitle') }}</p>

      <!-- Use EventCategories component without header, no navigation -->
      <EventCategories
        v-model="selectedCategoryId"
        bg-class="bg-transparent"
        :show-header="false"
        :disable-navigation="true"
      />

      <div class="actions">
        <ButtonMain
          class="w-100"
          :label="$t('onboarding.category.continue')"
          variant="main"
          :disabled="!selectedCategoryId"
          @click="onContinue"
        />
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ButtonMain from '@/components/generic/ButtonMain.vue';
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
  background: var(--bg-main);
  display: grid;
  place-items: center;
  padding: 40px 16px;
}

.wrap {
  width: 100%;
  max-width: 1180px;
  display: grid;
  gap: 24px;
}

.title {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  color: var(--neutral-900);
  text-align: center;
}

.subtitle {
  margin: 0;
  font-size: 16px;
  color: var(--neutral-700);
  text-align: center;
}

.actions {
  max-width: 420px;
  margin: 10px auto 0;
}

.w-100 { width: 100%; }
</style>
