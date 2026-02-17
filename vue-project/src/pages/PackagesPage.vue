<template>
  <div>
    <Header />
    <section class="packages-page">
    <h2 class="packages-title">{{ $t("packages.title") }}</h2>
    <p class="packages-subtitle">{{ $t("packages.subtitle") }}</p>

    <!-- Category Switch -->
    <div class="switch-group">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="switch-btn"
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
    <p v-else-if="error" class="packages-error">{{ error }}</p>

    <!-- Empty state -->
    <p v-else-if="!packages.length" class="packages-empty">
      {{ $t("packages.empty") }}
    </p>

    <!-- Package Cards -->
    <div v-else class="packages-grid">
      <div
        v-for="pkg in packages"
        :key="pkg.id"
        class="package-card"
        :class="{ featured: pkg.packageType === 'INV_PRO' || pkg.packageType === 'IVY_PREMIUM' }"
      >
        <span
          v-if="pkg.packageType === 'INV_PRO' || pkg.packageType === 'IVY_PREMIUM'"
          class="badge-popular"
        >
          {{ $t("packages.popular") }}
        </span>

        <h4 class="package-name">{{ pkg.name }}</h4>

        <p class="package-type">{{ formatType(pkg.packageType) }}</p>

        <div class="package-price">
          <span class="price-amount">&euro;{{ pkg.price }}</span>
        </div>

        <CpayButton
          :packageType="pkg.packageType"
          :label="$t('packages.choose')"
          variant="gold"
        />
      </div>
    </div>
  </section>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { packageService } from "@/services/package.service";
import CpayButton from "@/components/payment/CpayButton.vue";
import Header from "@/components/header/Header.vue";
import Footer from "@/components/layout/Footer.vue";

const { t } = useI18n();
const route = useRoute();

const validTabs = ["organizer", "invitation", "gallery"];
const queryTab = route.query.tab;
const initialTab = validTabs.includes(queryTab) ? queryTab : "organizer";

const activeTab = ref(initialTab);
const packages = ref([]);
const loading = ref(true);
const error = ref(null);

const tabs = computed(() => [
  { key: "organizer", label: t("packages.tabs.organizer") },
  { key: "invitation", label: t("packages.tabs.invitation") },
  { key: "gallery", label: t("packages.tabs.gallery") },
]);

const TAB_CATEGORY_MAP = {
  organizer: "ORGANIZER",
  invitation: "WEDDING",
  gallery: "GALLERY",
};

function formatType(type) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

watch(activeTab, fetchPackages);
onMounted(fetchPackages);
</script>

<style scoped>
.packages-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 48px 20px 80px;
  text-align: center;
}

.packages-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--brand-dark, #2f3e36);
  margin-bottom: 8px;
}

.packages-subtitle {
  color: var(--neutral-500, #6b7280);
  font-size: 1rem;
  margin-bottom: 32px;
}

/* ---- Switch Toggle ---- */
.switch-group {
  display: inline-flex;
  background: var(--neutral-100, #f3f4f6);
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
  margin-bottom: 40px;
}

.switch-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--neutral-600, #4b5563);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.switch-btn.active {
  background: var(--brand-gold, #c8a24d);
  color: #fff;
  box-shadow: 0 2px 8px rgba(200, 162, 77, 0.3);
}

.switch-btn:hover:not(.active) {
  background: var(--neutral-200, #e5e7eb);
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

.package-type {
  font-size: 13px;
  color: var(--neutral-400, #9ca3af);
  margin: 0;
}

.package-price {
  margin: 8px 0 12px;
}

.price-amount {
  font-size: 2rem;
  font-weight: 800;
  color: var(--brand-dark, #2f3e36);
}

/* ---- States ---- */
.packages-loading {
  padding: 60px 0;
}

.spinner {
  display: inline-block;
  width: 32px;
  height: 32px;
  border: 3px solid var(--neutral-200, #e5e7eb);
  border-top-color: var(--brand-gold, #c8a24d);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.packages-error {
  color: var(--error, #c62828);
  font-weight: 600;
  padding: 40px 0;
}

.packages-empty {
  color: var(--neutral-500, #6b7280);
  padding: 40px 0;
  font-size: 15px;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .packages-page {
    padding: 36px 16px 60px;
  }

  .packages-title {
    font-size: 1.5rem;
  }

  .packages-subtitle {
    font-size: 0.9375rem;
    margin-bottom: 24px;
  }

  .switch-group {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 28px;
  }

  .switch-btn {
    padding: 8px 18px;
    font-size: 13px;
  }

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
