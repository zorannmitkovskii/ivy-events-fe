<template>
  <section class="invitationPackageSection" id="pricing">
    <div class="packageIntro">
      <div>
        <p class="tag">{{ $t("packages.subtitle") }}</p>
        <h2>{{ $t("packages.title") }}</h2>
      </div>

      <!-- Invitation plans or gallery plans. The design shows the two as
           separate sections; here they share one grid and this switch, because
           the packages themselves come from the API per category. -->
      <div class="packageAnchor">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="{ on: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="packages-loading">
      <span class="spinner"></span>
    </div>

    <p v-else-if="error" class="packages-note packages-error">{{ error }}</p>

    <p v-else-if="!packages.length" class="packages-note">{{ $t("packages.empty") }}</p>

    <div v-else class="pricegrid">
      <article
        v-for="pkg in packages"
        :key="pkg.id"
        class="pricecard"
        :class="{ popular: isPopular(pkg) }"
      >
        <span class="planbadge">
          {{ isPopular(pkg) ? $t("packages.popular") : "" }}
        </span>

        <p>{{ localized(pkg.nameI18n, pkg.name) }}</p>

        <h2>
          <template v-if="pkg.activeDiscount && pkg.discount">
            <s class="price-old">{{ formatAmount(pkg.price) }}</s>
            {{ formatAmount(pkg.currentPrice) }}
          </template>
          <template v-else>{{ formatAmount(pkg.currentPrice ?? pkg.price) }}</template>
          <small> {{ pkg.currency || "MKD" }}</small>
        </h2>

        <p>{{ localized(pkg.descriptionI18n, pkg.description) }}</p>

        <ul v-if="pkg.features && pkg.features.length">
          <PricingFeature
            v-for="feat in pkg.features"
            :key="feat.id"
            :included="feat.included"
          >
            {{ localized(feat.nameI18n, feat.name) }}
          </PricingFeature>
        </ul>

        <CpayButton
          :packageType="pkg.packageType"
          :price="pkg.currentPrice ?? pkg.price"
          :label="`${$t('packages.choose')} ↗`"
          variant="gold"
        />
      </article>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { packageService } from "@/services/package.service";
import CpayButton from "@/components/payment/CpayButton.vue";
import PricingFeature from "@/components/cards/PricingFeature.vue";

const { t, locale } = useI18n();

const activeTab = ref("invitation");
const packages = ref([]);
const loading = ref(true);
const error = ref(null);

const POPULAR_TYPES = ["INV_PRO", "GALLERY_PREMIUM"];

function isPopular(pkg) {
  return POPULAR_TYPES.includes(pkg.packageType);
}

function localized(i18nObj, fallback) {
  if (!i18nObj) return fallback || "";
  return i18nObj[locale.value] || i18nObj.en || fallback || "";
}

/* The design sets the figure large in the serif and the currency small beside
   it, so the two are formatted apart rather than as one string. */
function formatAmount(price) {
  if (price == null) return "";
  const num = Number(price);
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
}

const tabs = computed(() => [
  { key: "invitation", label: t("packages.tabs.invitation") },
  { key: "gallery", label: t("packages.tabs.gallery") },
]);

const TAB_CATEGORY_MAP = {
  invitation: "WEDDING",
  gallery: "GALLERY",
};

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
/* `.invitationPackageSection`, `.packageIntro`, `.packageAnchor`, `.pricegrid`
   and `.pricecard` are all the design's, in `ivy/site.css`. Only the three
   states the mock has no version of are local. */

/* The design's right-hand column here is a paragraph of explanation; ours is
   the category switch, so it sits on the heading's baseline at the far edge
   rather than filling the column. */
.packageIntro .packageAnchor {
  justify-self: end;
  align-self: end;
  margin-top: 0;
}

.packages-loading {
  display: flex;
  justify-content: center;
  padding: 48px 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(23, 55, 43, 0.12);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.packages-note {
  padding: 0 24px;
  text-align: center;
  font: 15px/1.8 var(--font-display);
  color: var(--ink-3);
}

.packages-error {
  color: var(--error);
}

.price-old {
  margin-right: 10px;
  color: var(--ink-4);
  font-size: 24px;
  text-decoration-thickness: 1px;
}

/*
  The plan's call to action is CpayButton — a shared component with its own
  variants, used here, in the checkout and in the event sidebar. Rather than
  add a fifth variant for one page, the card restates it as the design's `.btn`
  on the way past: full width, ink ground, no card glyph.
*/
.pricecard :deep(.cpay-btn) {
  width: 100%;
  justify-content: center;
  min-height: 46px;
  padding: 15px 24px;
  border: 0;
  border-radius: var(--radius-control);
  background: var(--ink);
  color: #fff;
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: transform 0.3s, box-shadow 0.3s;
}

.pricecard.popular :deep(.cpay-btn) {
  background: var(--gold);
}

.pricecard :deep(.cpay-btn:hover:not(:disabled)) {
  background: var(--ink);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(23, 55, 43, 0.18);
}

.pricecard.popular :deep(.cpay-btn:hover:not(:disabled)) {
  background: var(--gold);
}

.pricecard :deep(.cpay-icon) {
  display: none;
}
</style>
