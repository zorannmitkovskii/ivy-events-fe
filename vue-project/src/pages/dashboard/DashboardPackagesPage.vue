<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { packageService } from "@/services/package.service";
import { onboardingStore } from "@/store/onboarding.store";
import CpayButton from "@/components/payment/CpayButton.vue";
import PricingFeature from "@/components/cards/PricingFeature.vue";

const { t, locale } = useI18n();

const packages = ref([]);
const loading = ref(true);
const error = ref(null);

const eventId = computed(() => onboardingStore.eventId);
const category = computed(() => onboardingStore.selectedCategory || "WEDDING");

function localized(i18nObj, fallback) {
  if (!i18nObj) return fallback || "";
  return i18nObj[locale.value] || i18nObj.en || fallback || "";
}

function formatPrice(price, currency) {
  if (price == null) return "";
  const num = Number(price);
  const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(2);
  return `${formatted} ${currency || "MKD"}`;
}

async function fetchPackages() {
  loading.value = true;
  error.value = null;
  try {
    const res = await packageService.listByCategory(category.value);
    packages.value = Array.isArray(res) ? res : (res.data ?? []);
  } catch (e) {
    error.value = t("packages.loadError");
    packages.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchPackages);
</script>

<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <h1 class="dash-page-title">{{ t("packages.title") }}</h1>
      <p class="dash-page-subtitle">{{ t("packages.subtitle") }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="packages-loading">
      <span class="spinner"></span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <!-- Empty state -->
    <div v-else-if="!packages.length" class="empty-card">
      <div class="empty-title">{{ t("packages.empty") }}</div>
    </div>

    <!-- Package Cards -->
    <div v-else class="packages-grid">
      <div
        v-for="pkg in packages"
        :key="pkg.id"
        class="package-card"
        :class="{ featured: pkg.packageType === 'INV_PRO' }"
      >
        <span
          v-if="pkg.packageType === 'INV_PRO'"
          class="badge-popular"
        >
          {{ t("packages.popular") }}
        </span>

        <h4 class="package-name">{{ localized(pkg.nameI18n, pkg.name) }}</h4>
        <p class="package-desc" v-if="localized(pkg.descriptionI18n, pkg.description)">
          {{ localized(pkg.descriptionI18n, pkg.description) }}
        </p>

        <div class="package-price">
          <template v-if="pkg.activeDiscount && pkg.discount">
            <span class="price-old">{{ formatPrice(pkg.price, pkg.currency) }}</span>
            <span class="price-amount">{{ formatPrice(pkg.currentPrice, pkg.currency) }}</span>
            <span class="price-badge">-{{ pkg.discount }}%</span>
          </template>
          <span v-else class="price-amount">{{ formatPrice(pkg.currentPrice ?? pkg.price, pkg.currency) }}</span>
        </div>

        <!-- Features -->
        <ul v-if="pkg.features && pkg.features.length" class="card__features">
          <PricingFeature
            v-for="feat in pkg.features"
            :key="feat.id"
            :included="feat.included"
          >
            {{ localized(feat.nameI18n, feat.name) }}
          </PricingFeature>
        </ul>

        <CpayButton
          :package-type="pkg.packageType"
          :event-id="eventId"
          :label="t('packages.choose')"
          variant="gold"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.packages-loading {
  padding: 60px 0;
  text-align: center;
}

.spinner {
  display: inline-block;
  width: 32px;
  height: 32px;
  border: 3px solid var(--neutral-300, #e5e7eb);
  border-top-color: var(--brand-gold, #c8a24d);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-msg {
  padding: 18px 0;
  color: #b00020;
}

.empty-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 40px 24px;
  text-align: center;
}

.empty-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--neutral-500);
}

/* ---- Grid ---- */
.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  text-align: center;
}

/* ---- Card ---- */
.package-card {
  position: relative;
  background: #fff;
  border: 1px solid var(--neutral-200, #e5e7eb);
  border-radius: 16px;
  padding: 36px 28px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.package-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

.package-card.featured {
  border-color: var(--brand-gold, #c8a24d);
  box-shadow: 0 4px 20px rgba(200, 162, 77, 0.15);
}

.badge-popular {
  position: absolute;
  top: -12px;
  background: var(--brand-gold, #c8a24d);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 14px;
  border-radius: 20px;
}

.package-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--brand-dark, #2f3e36);
  margin: 0;
}

.package-desc {
  font-size: 13px;
  color: var(--neutral-500, #6b7280);
  margin: 0;
  line-height: 1.4;
}

.package-price {
  margin: 8px 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.price-amount {
  font-size: 2rem;
  font-weight: 800;
  color: var(--brand-dark, #2f3e36);
}

.price-old {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--neutral-400, #9ca3af);
  text-decoration: line-through;
}

.price-badge {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: #059669;
  padding: 2px 8px;
  border-radius: 12px;
}

/* ---- Features ---- */
.card__features {
  list-style: none;
  padding: 0;
  margin: 8px 0 12px;
  width: 100%;
  text-align: left;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .packages-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .package-card {
    padding: 28px 20px 24px;
  }

  .price-amount {
    font-size: 1.75rem;
  }
}
</style>
