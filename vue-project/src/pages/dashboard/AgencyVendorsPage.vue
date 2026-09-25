<template>
  <div>
    <PageHead
      :title="isOwner ? t('agencyScreens.vendors.ownerTitle') : t('agencyScreens.vendors.memberTitle')"
      :subtitle="isOwner ? t('agencyScreens.vendors.ownerSubtitle') : t('agencyScreens.vendors.memberSubtitle')"
    >
      <template #actions>
        <router-link class="btn btn-ghost btn-sm" :to="{ name: 'VendorDirectory', params: { lang } }">
          {{ t('agencyVendors.publicDirectory') }}
        </router-link>
      </template>
    </PageHead>

    <!--
      The owner's half of the design: which vendors the agency's events are
      waiting on. Drawn from the held bookings the agency home already reads;
      a member is not shown engagements at all — contracts and prices are the
      agency's, and the member's screen is the directory alone.
    -->
    <section v-if="isOwner" class="card engagements" aria-labelledby="vendor-engagements">
      <div class="engagements-head">
        <div>
          <h2 id="vendor-engagements">{{ t('agencyScreens.vendors.engagements') }}</h2>
          <p class="lede">{{ t('agencyScreens.vendors.engagementsHint') }}</p>
        </div>
        <div class="status-filter" role="group" :aria-label="t('agencyScreens.vendors.statusLabel')">
          <button
            v-for="option in STATUS_FILTERS"
            :key="option"
            type="button"
            :class="{ on: statusFilter === option }"
            :aria-pressed="statusFilter === option"
            @click="statusFilter = option"
          >{{ t(`agencyScreens.vendors.status.${option}`) }} <b>{{ countOf(option) }}</b></button>
        </div>
      </div>
      <ul v-if="shownEngagements.length" class="lines">
        <li v-for="engagement in shownEngagements" :key="engagement.bookingId" class="line">
          <div>
            <b>{{ engagement.vendorName }}</b>
            <small>{{ engagementLine(engagement) }}</small>
          </div>
          <span :class="['pill', STATUS_TONE[engagement.status]]">{{ t(`agencyScreens.vendors.status.${engagement.status}`) }}</span>
        </li>
      </ul>
      <p v-else class="lane-empty">{{ t('agencyScreens.vendors.noEngagements') }}</p>
    </section>

    <div class="toolbar vendor-filters">
      <label class="filter-field wide">
        <span>{{ t('agencyScreens.vendors.search') }}</span>
        <input v-model="query" type="search" :placeholder="t('agencyVendors.searchPlaceholder')" />
      </label>
      <label class="filter-field">
        <span>{{ t('agencyScreens.vendors.category') }}</span>
        <select v-model="type" :aria-label="t('agencyVendors.filterLabel')">
          <option v-for="option in typeFilters" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
    </div>
    <p v-if="loading" class="empty">{{ t('common.loading') }}</p>

    <p v-else-if="error" class="empty" role="alert">{{ error }}</p>

    <div v-else-if="vendors.length" class="vcards">
      <article v-for="vendor in vendors" :key="vendor.id || vendor.slug" class="vcard">
        <!-- Direct children of `.vcard`, not wrapped: it is a flex column, so a
             wrapper would make the name and the trade one row and run them
             together. -->
        <span class="av">{{ initials(vendor.name) }}</span>
        <b>{{ vendor.name }}</b>
        <small>{{ typeLabel(vendor.type) }}<template v-if="vendor.city"> · {{ vendor.city }}</template></small>

        <div class="vcard-foot">
          <span v-if="vendor.rating" class="rating">★ {{ vendor.rating.toFixed(1) }}</span>
          <router-link class="btn btn-ghost btn-sm" :to="vendorTo(vendor)">
            {{ t('agencyVendors.open') }}
          </router-link>
        </div>
      </article>
    </div>

    <p v-else class="empty">{{ t('agencyVendors.empty') }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import { readableVendorType } from '@/enums/VendorType.js'
import { useVendorTypes } from '@/composables/usePublicCatalog'
import { vendorDirectoryService } from '@/services/vendorDirectory.service'
import { getErrorMessage } from '@/services/apiError'
import { agencyWorkspaceService } from '@/services/agencyWorkspace.service'
import { useAgencyRole } from '@/composables/useAgencyRole'
import { formatDay } from '@/utils/agencyFormat.js'

/*
  The suppliers an agency books from, inside the console rather than out on the
  public site.

  Same endpoint as the public directory — there is one approved-vendor list and
  a second one for agencies would be a second thing to keep approved. What is
  different is the frame: no marketing page around it, and a row opens the
  vendor's profile in the same tab as the work.
*/

const SEARCH_DEBOUNCE_MS = 300
const ALL = ''

const { t, locale } = useI18n()

/** Every trade the backend lists, for the filter row. */
const { codes: vendorTypeCodes, load: loadVendorTypes } = useVendorTypes()
loadVendorTypes()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')
const { isOwner } = useAgencyRole()

const STATUS_FILTERS = ['ALL', 'HELD', 'CONFIRMED', 'CANCELLED']
const STATUS_TONE = { HELD: 'amber', CONFIRMED: 'green', CANCELLED: 'slate' }

/**
 * Every booking on the agency's events — held, confirmed and cancelled — for
 * the owner's engagements panel. Held ones are what needs a decision, so the
 * panel opens on them; the others answer "who do we work with".
 */
const engagements = ref([])
const statusFilter = ref('HELD')

async function loadEngagements() {
  if (!isOwner.value) return
  try {
    const response = await agencyWorkspaceService.vendors()
    engagements.value = (response?.data?.data ?? response?.data)?.engagements ?? []
  } catch {
    // The directory below is the page's job; a missing panel is not an error.
    engagements.value = []
  }
}

const shownEngagements = computed(() =>
  statusFilter.value === 'ALL'
    ? engagements.value
    : engagements.value.filter((engagement) => engagement.status === statusFilter.value),
)

const countOf = (status) =>
  status === 'ALL' ? engagements.value.length : engagements.value.filter((e) => e.status === status).length

function engagementLine(engagement) {
  const date = engagement.eventDate ? formatDay(engagement.eventDate, locale.value) : ''
  return [engagement.title, engagement.eventName, date].filter(Boolean).join(' · ')
}

const vendors = ref([])
const type = ref(ALL)
const query = ref('')
const loading = ref(true)
const error = ref('')

/*
  Every trade, not the ones on the current page. The list is server-paged at
  twenty-four, so deriving the filters from what came back would offer a row
  that changes as you page through it and hides the trades on page two.
*/
const typeFilters = computed(() => [
  { value: ALL, label: t('agencyVendors.allTypes') },
  ...vendorTypeCodes.value.map((value) => ({ value, label: typeLabel(value) })),
])

/** A trade with no translation yet reads as words, not as an enum name. */
function typeLabel(value) {
  return value ? t(`vendorType.${value}`, readableVendorType(value)) : ''
}

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join('')
}

function vendorTo(vendor) {
  return {
    name: 'VendorProfile',
    params: { lang: lang.value, category: String(vendor.type || 'all').toLowerCase(), slug: vendor.slug },
  }
}

let debounce = null

onMounted(() => {
  load()
  loadEngagements()
})

watch(type, load)
watch(query, () => {
  clearTimeout(debounce)
  debounce = setTimeout(load, SEARCH_DEBOUNCE_MS)
})

async function load() {
  loading.value = true
  try {
    const response = await vendorDirectoryService.search({
      type: type.value || undefined,
      q: query.value.trim() || undefined,
    })
    const page = response?.data ?? response ?? {}
    vendors.value = page.content ?? (Array.isArray(page) ? page : [])
    error.value = ''
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped src="../../components/agency/agency-panels.css"></style>

<style scoped>
/* `.toolbar`, `.vcards`, `.vcard`, `.av` and `.chip` are the design's, in
   `ivy/dash.css`. Local: the owner's engagements panel and the two filters —
   a search and a category select, as the 2026 agency design has them. */
.engagements {
  margin-bottom: 16px;
}

.engagements-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.status-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.status-filter button {
  padding: 6px 11px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  color: var(--ink-2);
  font-size: 13px;
}

.status-filter button.on {
  background: var(--mist);
  border-color: var(--moss);
  color: var(--ivy);
  font-weight: 700;
}

.status-filter b {
  margin-left: 4px;
  font-weight: 700;
}

.engagements h2 {
  margin: 0;
  font-size: 19px;
}

.lane-empty {
  margin: 8px 0 0;
  color: var(--ink-3);
  font-size: 13px;
}

.vendor-filters {
  align-items: flex-end;
  gap: 10px;
}

.filter-field {
  flex: 1;
  min-width: 170px;
}

.filter-field.wide {
  flex: 2;
  min-width: 220px;
}

.filter-field span {
  display: block;
  margin-bottom: 5px;
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 600;
}

.filter-field input,
.filter-field select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  font: inherit;
  font-size: 14px;
}

/* `.vcard .btn { margin-top: auto }` is what pins the action to the bottom of
   a card; the rule has to reach this row rather than the button inside it. */
.vcard-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 6px;
}

</style>
