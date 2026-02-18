<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { packageService } from "@/services/package.service";
import { onboardingStore } from "@/store/onboarding.store";
import publicApi from "@/services/backendApi";
import CpayButton from "@/components/payment/CpayButton.vue";
import PricingFeature from "@/components/cards/PricingFeature.vue";

const { t, locale } = useI18n();

const packages = ref([]);
const loading = ref(true);
const error = ref(null);

const eventId = computed(() => onboardingStore.eventId);
const category = computed(() => onboardingStore.selectedCategory || "WEDDING");

// Discount code state
const discountCode = ref("");
const discountLoading = ref(false);
const discountResult = ref(null); // { valid, message, discountPercent, promotionName }
const discountError = ref(null);

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

function getDisplayPrice(pkg) {
  const base = pkg.currentPrice ?? pkg.price;
  if (!discountResult.value?.valid || !discountResult.value.discountPercent) return base;
  return Math.round(base * (1 - discountResult.value.discountPercent / 100));
}

async function validateDiscount() {
  if (!discountCode.value.trim()) return;
  discountLoading.value = true;
  discountError.value = null;
  discountResult.value = null;
  try {
    const res = await publicApi.post("/public/discounts/validate", { code: discountCode.value.trim() });
    discountResult.value = res.data;
    if (!res.data.valid) {
      discountError.value = res.data.message || t("packages.invalidCode");
    }
  } catch (e) {
    discountError.value = e?.response?.data?.message || t("packages.invalidCode");
  } finally {
    discountLoading.value = false;
  }
}

function clearDiscount() {
  discountCode.value = "";
  discountResult.value = null;
  discountError.value = null;
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

    <template v-else>
      <!-- Discount Code -->
      <div class="discount-section">
        <div class="discount-input-row">
          <input
            v-model="discountCode"
            type="text"
            class="discount-input"
            :placeholder="t('packages.codePh')"
            :disabled="discountLoading"
            @keydown.enter.prevent="validateDiscount"
          />
          <button
            class="discount-btn"
            :disabled="!discountCode.trim() || discountLoading"
            @click="validateDiscount"
          >
            {{ discountLoading ? t('packages.validating') : t('packages.applyCode') }}
          </button>
        </div>
        <div v-if="discountResult?.valid" class="discount-success">
          <span>{{ discountResult.promotionName }} &mdash; -{{ discountResult.discountPercent }}%</span>
          <button class="discount-clear" @click="clearDiscount">&times;</button>
        </div>
        <div v-if="discountError" class="discount-error">{{ discountError }}</div>
      </div>

      <!-- Package Cards -->
      <div class="packages-grid">
      <div
        v-for="pkg in packages"
        :key="pkg.id"
        class="package-card"
        :class="{ featured: pkg.packageType === 'INV_PRO' || pkg.packageType === 'GALLERY_PREMIUM' }"
      >
        <span
          v-if="pkg.packageType === 'INV_PRO' || pkg.packageType === 'GALLERY_PREMIUM'"
          class="badge-popular"
        >
          {{ t("packages.popular") }}
        </span>

        <h4 class="package-name">{{ localized(pkg.nameI18n, pkg.name) }}</h4>
        <p class="package-desc" v-if="localized(pkg.descriptionI18n, pkg.description)">
          {{ localized(pkg.descriptionI18n, pkg.description) }}
        </p>

        <div class="package-price">
          <template v-if="discountResult?.valid && discountResult.discountPercent">
            <span class="price-old">{{ formatPrice(pkg.currentPrice ?? pkg.price, pkg.currency) }}</span>
            <span class="price-amount">{{ formatPrice(getDisplayPrice(pkg), pkg.currency) }}</span>
            <span class="price-badge">-{{ discountResult.discountPercent }}%</span>
          </template>
          <template v-else-if="pkg.activeDiscount && pkg.discount">
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
    </template>
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

/* ---- Discount Code ---- */
.discount-section {
  background: #fff;
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 18px 24px;
}

.discount-input-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.discount-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--neutral-300, #ddd);
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  background: var(--bg-main, #f8f6f1);
  color: var(--neutral-900);
  max-width: 320px;
}

.discount-input:focus {
  outline: none;
  border-color: var(--brand-gold, #C8A24D);
  box-shadow: 0 0 0 2px rgba(200, 162, 77, 0.15);
}

.discount-btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-md, 8px);
  background: var(--brand-gold, #c8a24d);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s ease;
}

.discount-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.discount-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.discount-success {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 600;
}

.discount-clear {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #2e7d32;
  padding: 0 4px;
  line-height: 1;
}

.discount-error {
  margin-top: 8px;
  font-size: 13px;
  color: #c62828;
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
