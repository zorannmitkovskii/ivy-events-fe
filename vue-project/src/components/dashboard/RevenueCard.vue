<template>
  <StatCard
    class="revenue-card"
    :label="t('adminRevenue.title')"
    :value="figure"
    :rows="rows"
    :hint="revenue?.definition || t('adminRevenue.hint')"
    :hint-label="t('adminRevenue.title')"
  >
    <p v-if="error" class="revenue-error" role="alert">{{ t('adminRevenue.error') }}</p>
    <p v-else-if="revenue" class="revenue-meta">
      {{ t('adminRevenue.payments', { n: revenue.payments }) }}
      <template v-if="Number(revenue.refunded) > 0">
        · {{ t('adminRevenue.refunded', { amount: money(revenue.refunded) }) }}
      </template>
    </p>

    <label class="revenue-filter">
      <span>{{ t('adminRevenue.package') }}</span>
      <select v-model="packageType">
        <option value="">{{ t('adminRevenue.allPackages') }}</option>
        <option v-for="type in PACKAGE_TYPES" :key="type" :value="type">
          {{ t(`adminRevenue.packages.${type}`) }}
        </option>
      </select>
    </label>
  </StatCard>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import StatCard from '@/components/dashboard/StatCard.vue'
import { analyticsService } from '@/services/analytics.service'

/**
 * What the platform earned, on the admin dashboard (IVY-1104).
 *
 * <p>Its own request, not part of the dashboard's: choosing a package reloads
 * this card alone, and a payments problem leaves the rest of the screen
 * standing. The period is the dashboard's applied range, passed in.
 *
 * <p>The breakdown lists the packages that earned something, whichever one is
 * chosen, so narrowing the figure never hides where the rest came from.
 */
const props = defineProps({
  from: { type: String, default: '' },
  to: { type: String, default: '' },
})

/** Mirrors the backend's `PackageType`. */
const PACKAGE_TYPES = ['INV_BASIC', 'INV_PRO', 'INV_PREMIUM', 'GALLERY_BASIC', 'GALLERY_PREMIUM']

const { t, locale } = useI18n()

const packageType = ref('')
const revenue = ref(null)
const loading = ref(false)
const error = ref(false)

// Only the newest answer is shown: a slow reply for the previous package must
// not overwrite the figure for the one chosen since.
let latestRequest = 0

const figure = computed(() => {
  if (error.value) return '—'
  if (!revenue.value) return '…'
  return money(revenue.value.net)
})

const rows = computed(() => (revenue.value?.byPackage || [])
  .filter((entry) => entry.payments > 0)
  .map((entry) => ({ label: t(`adminRevenue.packages.${entry.packageType}`), value: money(entry.net) })))

onMounted(load)
watch(() => [props.from, props.to, packageType.value], load)

async function load() {
  const request = ++latestRequest
  loading.value = true
  try {
    const response = await analyticsService.adminRevenue({
      from: props.from, to: props.to, packageType: packageType.value,
    })
    if (request !== latestRequest) return
    revenue.value = response?.data ?? response
    error.value = false
  } catch {
    if (request === latestRequest) error.value = true
  } finally {
    if (request === latestRequest) loading.value = false
  }
}

function money(amount) {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: revenue.value?.currency || 'MKD',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}
</script>

<style scoped>
.revenue-meta,
.revenue-error {
  margin: 8px 0 0;
  font-size: 0.85rem;
  color: var(--text-muted, #52514e);
}

.revenue-error {
  color: #b3261e;
}

.revenue-filter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 12px;
  font-size: 0.85rem;
  color: var(--text-muted, #52514e);
}

.revenue-filter select {
  border: 1px solid var(--border-color, #cbd0d6);
  border-radius: 8px;
  padding: 7px 10px;
  background: var(--cards-color, #fff);
  color: var(--text-color, #0b0b0b);
}
</style>
