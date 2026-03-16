<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { packageService } from "@/services/package.service";
import { onboardingStore } from "@/store/onboarding.store";
import { useAuthUser } from "@/composables/useAuthUser";
import { getUserId } from "@/services/auth.service";
import { cpayService } from "@/services/cpay.service";
import { redirectToCpay } from "@/utils/redirectToCpay";
import { getErrorMessage } from "@/services/apiError";
import publicApi from "@/services/backendApi";
import PricingFeature from "@/components/cards/PricingFeature.vue";

const { t, locale } = useI18n();
const { user, eventId: authEventId } = useAuthUser();

const packages = ref([]);
const loading = ref(true);
const error = ref(null);

const isGalleryEvent = computed(() => onboardingStore.selectedCategory === "GALLERY");

const activeTab = ref("invitation");

const tabList = computed(() => {
  if (isGalleryEvent.value) {
    return [{ key: "gallery", label: t("packages.tabs.gallery") }];
  }
  return [
    { key: "invitation", label: t("packages.tabs.invitation") },
    { key: "gallery", label: t("packages.tabs.gallery") },
  ];
});

const TAB_CATEGORY_MAP = {
  invitation: "WEDDING",
  gallery: "GALLERY",
};

const eventId = computed(() => onboardingStore.eventId);

/* ---- Cart ---- */
const cart = ref([]);

function addToCart(pkg) {
  if (cart.value.some(c => c.id === pkg.id)) return;
  cart.value.push({
    id: pkg.id,
    packageType: pkg.packageType,
    name: localized(pkg.nameI18n, pkg.name),
    price: getDisplayPrice(pkg),
    currency: pkg.currency || "MKD",
  });
}

function removeFromCart(id) {
  cart.value = cart.value.filter(c => c.id !== id);
}

function isInCart(id) {
  return cart.value.some(c => c.id === id);
}

const cartTotal = computed(() =>
  cart.value.reduce((sum, item) => sum + Number(item.price || 0), 0)
);

const cartCurrency = computed(() =>
  cart.value.length ? cart.value[0].currency : "MKD"
);

/* ---- Checkout ---- */
const checkoutLoading = ref(false);
const checkoutError = ref(null);

async function checkout() {
  if (!cart.value.length || checkoutLoading.value) return;
  checkoutLoading.value = true;
  checkoutError.value = null;

  try {
    const payload = {
      amount: cartTotal.value,
      currency: cartCurrency.value,
      description: "Payment",
      email: user.value?.email || "",
      telephone: user.value?.phone || "",
      eventId: eventId.value || authEventId.value,
      userId: getUserId(),
      packageTypes: cart.value.map(c => c.packageType),
    };
    const res = await cpayService.initPayment(payload);
    const data = res?.data ?? res;
    const paymentUrl = data.paymentUrl;
    const fields = data.fields;

    const orderRef = fields?.Details2 || fields?.details2 || "";
    if (orderRef) sessionStorage.setItem("cpay:lastOrderRef", orderRef);

    redirectToCpay(paymentUrl, fields);
  } catch (e) {
    checkoutError.value = getErrorMessage(e);
    checkoutLoading.value = false;
  }
}

// Discount code state
const discountCode = ref("");
const discountLoading = ref(false);
const discountResult = ref(null);
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
    const category = TAB_CATEGORY_MAP[activeTab.value];
    const res = await packageService.listByCategory(category);
    packages.value = Array.isArray(res) ? res : (res.data ?? []);
  } catch (e) {
    error.value = t("packages.loadError");
    packages.value = [];
  } finally {
    loading.value = false;
  }
}

watch(activeTab, () => fetchPackages());
onMounted(() => {
  if (isGalleryEvent.value) activeTab.value = "gallery";
  fetchPackages();
});
</script>

<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <div class="header-text">
        <div class="page-eyebrow">{{ t("sidebar.navigation") }}</div>
        <h1 class="dash-page-title">{{ t("packages.title") }}</h1>
        <p class="dash-page-subtitle">{{ t("packages.subtitle") }}</p>
      </div>
    </div>

    <!-- Cart -->
    <div class="cart-section" :class="{ 'cart-section--empty': !cart.length }">
      <div class="cart-header">
        <svg class="cart-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span class="cart-title">{{ t("packages.cart") }}</span>
        <span v-if="cart.length" class="cart-badge">{{ cart.length }}</span>
      </div>

      <div v-if="!cart.length" class="cart-empty">
        {{ t("packages.cartEmpty") }}
      </div>

      <template v-else>
        <div class="cart-items">
          <div v-for="item in cart" :key="item.id" class="cart-item">
            <div class="cart-item-info">
              <span class="cart-item-name">{{ item.name }}</span>
              <span class="cart-item-type">{{ item.packageType }}</span>
            </div>
            <span class="cart-item-price">{{ formatPrice(item.price, item.currency) }}</span>
            <button class="cart-item-remove" @click="removeFromCart(item.id)" :title="t('packages.removeFromCart')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="cart-footer">
          <div class="cart-total">
            <span>{{ t("packages.cartTotal") }}</span>
            <span class="cart-total-amount">{{ formatPrice(cartTotal, cartCurrency) }}</span>
          </div>
          <button
            class="cart-checkout-btn"
            :disabled="checkoutLoading"
            @click="checkout"
          >
            <span v-if="checkoutLoading" class="cart-spinner"></span>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            {{ checkoutLoading ? t("cpay.redirecting") : t("packages.checkout") }}
          </button>
          <p v-if="checkoutError" class="cart-error">{{ checkoutError }}</p>
        </div>
      </template>
    </div>

    <!-- Category Tabs -->
    <div class="tab-group">
      <button
        v-for="tab in tabList"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
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
            'in-cart': isInCart(pkg.id),
          }"
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

          <button
            class="add-cart-btn"
            :class="{ added: isInCart(pkg.id) }"
            @click.stop="isInCart(pkg.id) ? removeFromCart(pkg.id) : addToCart(pkg)"
          >
            <svg v-if="!isInCart(pkg.id)" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ isInCart(pkg.id) ? t("packages.inCart") : t("packages.addToCart") }}
          </button>
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

/* ---- Cart ---- */
.cart-section {
  background: var(--dash-cream-card);
  border-radius: var(--dash-radius);
  border: 1px solid var(--dash-cream-border);
  box-shadow: var(--dash-shadow-sm);
  padding: 20px 24px;
  margin-bottom: 24px;
}

.cart-section--empty {
  padding: 16px 24px;
}

.cart-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.cart-icon {
  color: var(--dash-gold);
}

.cart-title {
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  font-weight: 500;
  color: var(--dash-charcoal);
}

.cart-badge {
  background: var(--dash-gold);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cart-empty {
  font-size: 13px;
  color: var(--dash-muted);
  padding: 4px 0 0;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--dash-cream);
  border-radius: 10px;
  border: 1px solid var(--dash-cream-border);
}

.cart-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cart-item-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--dash-charcoal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cart-item-type {
  font-size: 11px;
  color: var(--dash-muted);
  letter-spacing: 0.02em;
}

.cart-item-price {
  font-family: 'Playfair Display', serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--dash-charcoal);
  white-space: nowrap;
}

.cart-item-remove {
  background: none;
  border: none;
  color: var(--dash-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.cart-item-remove:hover {
  background: #fef2f2;
  color: #dc2626;
}

.cart-footer {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--dash-cream-border);
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.cart-total {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--dash-muted);
  font-weight: 500;
}

.cart-total-amount {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 500;
  color: var(--dash-charcoal);
}

.cart-checkout-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 28px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--dash-gold), #9a7a3e);
  color: #fff;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 12px rgba(184, 149, 78, 0.3);
}

.cart-checkout-btn:hover:not(:disabled) {
  box-shadow: 0 4px 20px rgba(184, 149, 78, 0.45);
  transform: translateY(-1px);
}

.cart-checkout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cart-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.cart-error {
  width: 100%;
  margin: 8px 0 0;
  font-size: 13px;
  color: #9a5e56;
  font-weight: 500;
}

/* ---- Tabs ---- */
.tab-group {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.tab-btn {
  padding: 10px 22px;
  border: 1.5px solid var(--dash-cream-border);
  border-radius: 10px;
  background: var(--dash-cream-card);
  color: var(--dash-muted);
  font-family: 'Outfit', sans-serif;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: var(--dash-gold-light);
  color: var(--dash-charcoal);
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--dash-gold), #9a7a3e);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 10px rgba(184, 149, 78, 0.25);
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
  grid-template-columns: repeat(3, 1fr);
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

.package-card.in-cart {
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

/* ---- Add to Cart Button ---- */
.add-cart-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border: 1.5px solid var(--dash-cream-border);
  border-radius: 10px;
  background: #fff;
  color: var(--dash-charcoal);
  font-family: 'Outfit', sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;
}

.add-cart-btn:hover {
  border-color: var(--dash-gold);
  background: rgba(184, 149, 78, 0.06);
}

.add-cart-btn.added {
  background: linear-gradient(135deg, var(--dash-gold), #9a7a3e);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(184, 149, 78, 0.25);
}

.add-cart-btn.added:hover {
  opacity: 0.85;
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
@media (max-width: 900px) {
  .packages-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .packages-grid {
    grid-template-columns: 1fr;
  }

  .package-card {
    padding: 28px 20px 24px;
  }

  .price-amount {
    font-size: 1.75rem;
  }

  .cart-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .cart-checkout-btn {
    justify-content: center;
  }
}
</style>
