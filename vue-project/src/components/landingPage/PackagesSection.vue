<template>
  <section class="section" id="pricing" aria-labelledby="price-title">
    <div class="wrap">
      <div class="cats-head">
        <div class="section-head" style="margin: 0">
          <h2 id="price-title">{{ $t('packages.title') }}</h2>
          <p>{{ $t('packages.subtitle') }}</p>
        </div>

        <!-- Invitation plans or gallery plans. The mockup lists only the first
             and mentions the second in a footnote; here the two are real
             catalogues from the API, so the switch is real too. -->
        <div class="pkg-tabs" role="tablist" :aria-label="$t('packages.title')">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.key"
            @click="activeTab = tab.key"
          >{{ tab.label }}</button>
        </div>
      </div>

      <div v-if="loading" class="packages-loading"><span class="spinner"></span></div>

      <p v-else-if="error" class="packages-note packages-error">{{ error }}</p>

      <p v-else-if="!packages.length" class="packages-note">{{ $t('packages.empty') }}</p>

      <div v-else class="plans">
        <article
          v-for="pkg in packages"
          :key="pkg.id"
          class="plan"
          :class="{ pro: isPopular(pkg) }"
        >
          <div class="for">
            <span>{{ localized(pkg.taglineI18n, pkg.tagline) }}</span>
            <span v-if="isPopular(pkg)" class="pop">{{ $t('packages.popular') }}</span>
          </div>

          <h3>{{ localized(pkg.nameI18n, pkg.name) }}</h3>

          <div class="price">
            <s v-if="pkg.activeDiscount && pkg.discount" class="price-old">{{ formatAmount(pkg.price) }}</s>
            {{ formatAmount(pkg.currentPrice ?? pkg.price) }}
            <small>{{ pkg.currency || 'MKD' }}</small>
          </div>

          <p class="desc">{{ localized(pkg.descriptionI18n, pkg.description) }}</p>

          <ul v-if="pkg.features && pkg.features.length">
            <PricingFeature v-for="feat in pkg.features" :key="feat.id" :included="feat.included">
              {{ localized(feat.nameI18n, feat.name) }}
            </PricingFeature>
          </ul>

          <router-link
            class="btn"
            :class="isPopular(pkg) ? 'btn-gold' : 'btn-ghost'"
            :to="startTo"
            @click="remember(pkg)"
          >{{ $t('packages.startWith', { plan: localized(pkg.nameI18n, pkg.name) }) }}</router-link>
        </article>
      </div>

      <div class="plans-note">
        <span>{{ $t('packages.noteGallery') }}</span>
        <span>{{ $t('packages.notePayment') }}</span>
        <router-link :to="{ name: 'packages', params: { lang } }">{{ $t('packages.fullComparison') }}</router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { packageService } from '@/services/package.service'
import PricingFeature from '@/components/cards/PricingFeature.vue'
import { isAuthenticated } from '@/services/auth.service'
import { setSelectedPackageType } from '@/store/onboarding.store'

const { t, locale } = useI18n()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const activeTab = ref('invitation')
const packages = ref([])
const loading = ref(true)
const error = ref(null)

const POPULAR_TYPES = ['INV_PRO', 'GALLERY_PREMIUM']

/*
  A price card starts the work; it does not take the money.

  It used to render a CpayButton, which calls `initPayment` the moment it is
  pressed — on a marketing page that means a payment opened for `userId: null`,
  with no email and no event attached to it. Nobody can pay for an invitation
  that does not exist yet, and the page says so three lines above the cards:
  "Пакет плаќате само пред да ја објавите и испратите."

  So the card remembers which plan was chosen and sends the visitor to the step
  they are actually on — signing up, or the in-app packages screen if they are
  already signed in and have an event to attach a purchase to.
*/
const startTo = computed(() =>
  isAuthenticated()
    ? { name: 'dashboard.packages', params: { lang: lang.value } }
    : { name: 'signup', params: { lang: lang.value } },
)

/** Carried on the onboarding store, which survives the round trip through
 *  e-mail verification. */
function remember(pkg) {
  setSelectedPackageType(pkg.packageType)
}

function isPopular(pkg) {
  return POPULAR_TYPES.includes(pkg.packageType)
}

function localized(i18nObj, fallback) {
  if (!i18nObj) return fallback || ''
  return i18nObj[locale.value] || i18nObj.en || fallback || ''
}

/* The design sets the figure large in the serif and the currency small beside
   it, so the two are formatted apart rather than as one string. */
function formatAmount(price) {
  if (price == null) return ''
  const num = Number(price)
  return Number.isInteger(num) ? num.toString() : num.toFixed(2)
}

const tabs = computed(() => [
  { key: 'invitation', label: t('packages.tabs.invitation') },
  { key: 'gallery', label: t('packages.tabs.gallery') },
])

const TAB_CATEGORY_MAP = {
  invitation: 'WEDDING',
  gallery: 'GALLERY',
}

async function fetchPackages() {
  loading.value = true
  error.value = null
  try {
    const res = await packageService.listByCategory(TAB_CATEGORY_MAP[activeTab.value])
    packages.value = Array.isArray(res) ? res : (res.data ?? [])
  } catch {
    error.value = t('packages.loadError')
    packages.value = []
  } finally {
    loading.value = false
  }
}

watch(activeTab, fetchPackages)
onMounted(fetchPackages)
</script>

<style scoped>
/* `.plans`, `.plan` and everything inside a card are the design's, in
   `ivy/site.css`. What is here is the category switch and the three states
   the mockup has no version of, because it has no API to be in them. */

.pkg-tabs {
  display: inline-flex;
  flex: none;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--mist-2);
}

.pkg-tabs button {
  padding: 8px 16px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  font-size: 14.5px;
  color: var(--ink-2);
}

.pkg-tabs button[aria-selected='true'] {
  background: var(--card);
  color: var(--ink);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.packages-loading {
  display: flex;
  justify-content: center;
  padding: 48px 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--line);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.packages-note {
  padding: 0 24px;
  text-align: center;
  font-size: 16px;
  color: var(--ink-3);
}

.packages-error {
  color: var(--error);
}

.price-old {
  margin-right: 10px;
  color: var(--ink-3);
  font-size: 24px;
  text-decoration-thickness: 1px;
}

</style>
