<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { packageService } from "@/services/package.service";
import { onboardingStore, setSelectedPackageType } from "@/store/onboarding.store";
import publicApi from "@/services/backendApi";
import CpayButton from "@/components/payment/CpayButton.vue";
import PricingFeature from "@/components/cards/PricingFeature.vue";

const { t, locale } = useI18n();

const packages = ref([]);
const loading = ref(true);
const error = ref(null);

const eventId = computed(() => onboardingStore.eventId);
const category = computed(() => onboardingStore.selectedCategory || "WEDDING");
const selectedPackageType = computed(() => onboardingStore.selectedPackageType);

function selectPackage(packageType) {
  setSelectedPackageType(packageType);
}

const selectedPackagePrice = computed(() => {
  const pkg = packages.value.find(p => p.packageType === selectedPackageType.value);
  return pkg ? getDisplayPrice(pkg) : 0;
});

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
      <div class="header-text">
        <div class="page-eyebrow">{{ t("sidebar.navigation") }}</div>
        <h1 class="dash-page-title">{{ t("packages.title") }}</h1>
        <p class="dash-page-subtitle">{{ t("packages.subtitle") }}</p>
      </div>
      <CpayButton
        v-if="selectedPackageType"
        :package-type="selectedPackageType"
        :event-id="eventId"
        :price="selectedPackagePrice"
        :label="t('packages.continuePayment')"
        variant="gold"
      />
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
        :class="{
          featured: pkg.packageType === 'INV_PRO' || pkg.packageType === 'GALLERY_PREMIUM',
          selected: pkg.packageType === selectedPackageType,
        }"
        @click="selectPackage(pkg.packageType)"
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
          :price="getDisplayPrice(pkg)"
          :label="t('packages.choose')"
          variant="gold"
        />
      </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dash-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.header-text {
  flex: 1;
  min-width: 0;
}

.packages-loading {
  padding: 60px 0;
  text-align: center;
}

.spinner {
  display: inline-block;
  width: 32px;
  height: 32px;
  border: 3px solid var(--dash-cream-border);
  border-top-color: var(--dash-gold);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-msg {
  padding: 18px 0;
  color: #9a5e56;
}

.empty-card {
  background: var(--dash-cream-card);
  border-radius: var(--dash-radius);
  border: 1px solid var(--dash-cream-border);
  box-shadow: var(--dash-shadow-sm);
  padding: 40px 24px;
  text-align: center;
}

.empty-title {
  font-family: 'Playfair Display', serif;
  font-weight: 400;
  font-size: 18px;
  color: var(--dash-charcoal);
}

/* ---- Grid ---- */
.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  text-align: center;
}

/* ---- Card ---- */
.package-card {
  position: relative;
  background: var(--dash-cream-card);
  border: 1px solid var(--dash-cream-border);
  border-radius: var(--dash-radius);
  padding: 36px 28px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.22s;
}

.package-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--dash-shadow-md);
}

.package-card.featured {
  border-color: var(--dash-gold);
  box-shadow: 0 4px 20px rgba(184, 149, 78, 0.15);
}

.package-card.selected {
  border-color: var(--dash-gold);
  border-width: 2px;
  box-shadow: 0 4px 20px rgba(184, 149, 78, 0.25);
  background: var(--dash-cream);
}

.badge-popular {
  position: absolute;
  top: -12px;
  background: linear-gradient(135deg, var(--dash-gold), #9a7a3e);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 14px;
  border-radius: 20px;
}

.package-name {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 400;
  color: var(--dash-charcoal);
  margin: 0;
}

.package-desc {
  font-size: 12.5px;
  color: var(--dash-muted);
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
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-weight: 400;
  color: var(--dash-charcoal);
}

.price-old {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--dash-light);
  text-decoration: line-through;
}

.price-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  background: var(--dash-sage);
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
  background: var(--dash-cream-card);
  border-radius: var(--dash-radius);
  border: 1px solid var(--dash-cream-border);
  box-shadow: var(--dash-shadow-sm);
  padding: 18px 24px;
}

.discount-input-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.discount-input {
  flex: 1;
  padding: 9px 14px;
  border: 1.5px solid var(--dash-cream-border);
  border-radius: 9px;
  font-size: 13px;
  font-family: 'Outfit', sans-serif;
  background: var(--dash-cream);
  color: var(--dash-ink);
  max-width: 320px;
}

.discount-input:focus {
  outline: none;
  border-color: var(--dash-gold-light);
  box-shadow: 0 0 0 2px rgba(184, 149, 78, 0.12);
  background: var(--dash-cream-card);
}

.discount-btn {
  padding: 9px 18px;
  border: none;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--dash-gold), #9a7a3e);
  color: #fff;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  box-shadow: 0 2px 10px rgba(184, 149, 78, 0.25);
}

.discount-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.discount-btn:hover:not(:disabled) {
  box-shadow: 0 4px 16px rgba(184, 149, 78, 0.4);
  transform: translateY(-1px);
}

.discount-success {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: var(--dash-sage-ghost);
  color: var(--dash-sage);
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
}

.discount-clear {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--dash-sage);
  padding: 0 4px;
  line-height: 1;
}

.discount-error {
  margin-top: 8px;
  font-size: 12px;
  color: #9a5e56;
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
