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

        <div></div>
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

    <!-- Sticky footer with action button -->
    <div v-if="selectedEnum && loggedIn" class="sticky-footer">
      <div class="footer-inner">
        <button
          class="action-btn"
          :disabled="creatingEvent"
          @click="onAction"
        >
          <span v-if="creatingEvent" class="btn-spinner"></span>
          {{ actionLabel }}
        </button>
      </div>
    </div>

    <OnboardingFooterLinks />
  </main>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import OnboardingFooterLinks from '@/components/onboarding/OnboardingFooterLinks.vue';
import { setSelectedCategory, setEventId, onboardingStore } from '@/store/onboarding.store';
import { eventsService } from '@/services/events.service';
import { isAuthenticated, getUsername } from '@/services/auth.service';
import EventCategories from "@/components/landingPage/EventCategories.vue";
import { categoryIdToEnum, enumToCategoryId } from "@/helper/CategoryMapping.helper.js";
import { EventCategoryEnum } from '@/enums/EventCategory';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');
const creatingEvent = ref(false);
const loggedIn = computed(() => isAuthenticated());

// Initialize with stored category (convert enum to ID for the component)
const selectedCategoryId = ref(
  onboardingStore.selectedCategory
    ? enumToCategoryId(onboardingStore.selectedCategory)
    : null
);

const selectedEnum = computed(() =>
  selectedCategoryId.value ? categoryIdToEnum(selectedCategoryId.value) : null
);

const isGallery = computed(() => selectedEnum.value === EventCategoryEnum.GALLERY);

const actionLabel = computed(() => {
  if (creatingEvent.value) return '...';
  return isGallery.value
    ? t('onboarding.category.create')
    : t('onboarding.category.next');
});

// Sync selection to store
watch(selectedCategoryId, (newId) => {
  if (newId) {
    const enumValue = categoryIdToEnum(newId);
    if (enumValue) setSelectedCategory(enumValue);
  }
});

async function onAction() {
  if (!selectedEnum.value) return;

  if (isGallery.value) {
    await createGalleryEvent();
  } else {
    await router.push({ name: 'EventInvitationsPage', params: { lang: lang.value } });
  }
}

async function createGalleryEvent() {
  if (creatingEvent.value) return;
  creatingEvent.value = true;
  try {
    const payload = {
      name: 'Gallery',
      categoryType: EventCategoryEnum.GALLERY,
      status: 'DRAFT',
      username: getUsername(),
      lang: lang.value,
    };
    const res = await eventsService.create(payload);
    const eventId = res?.id || res?.eventId;
    if (eventId) setEventId(eventId);
    await router.push({ name: 'dashboard.overview', params: { lang: lang.value } });
  } catch (e) {
    console.error('[EventCategoryPage] failed to create gallery event:', e);
    creatingEvent.value = false;
  }
}

function onBack() {
  router.push({ name: 'home', params: { lang: lang.value } });
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
  padding: 24px 24px 120px;
}

/* ===== Sticky footer ===== */
.sticky-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  border-top: 1px solid rgba(16, 24, 40, 0.08);
  box-shadow: 0 -2px 8px rgba(16, 24, 40, 0.06);
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 36px;
  border: none;
  border-radius: 12px;
  background: var(--brand-main, #334338);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}

.action-btn:hover:not(:disabled) {
  background: var(--brand-dark, #263029);
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
    padding: 16px 16px 120px;
  }

  .footer-inner {
    padding: 12px 16px;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
