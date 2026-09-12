<template>
  <div>
    <PageHead :title="t('agencyVendors.title')" :subtitle="t('agencyVendors.subtitle')">
      <template #actions>
        <router-link class="btn btn-ghost btn-sm" :to="{ name: 'VendorDirectory', params: { lang } }">
          {{ t('agencyVendors.publicDirectory') }}
        </router-link>
      </template>
    </PageHead>

    <div class="toolbar">
      <div class="filters-row" role="group" :aria-label="t('agencyVendors.filterLabel')">
        <button
          v-for="option in typeFilters"
          :key="option.value"
          type="button"
          :aria-pressed="type === option.value"
          @click="type = option.value"
        >{{ option.label }}</button>
      </div>

      <label class="search-field">
        <span class="sr-only">{{ t('agencyVendors.searchLabel') }}</span>
        <input v-model="query" type="search" :placeholder="t('agencyVendors.searchPlaceholder')" />
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
import { VENDOR_TYPES, readableVendorType } from '@/enums/VendorType.js'
import { vendorDirectoryService } from '@/services/vendorDirectory.service'
import { getErrorMessage } from '@/services/apiError'

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

const { t } = useI18n()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

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
  ...VENDOR_TYPES.map((value) => ({ value, label: typeLabel(value) })),
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

onMounted(load)

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

<style scoped>
/* `.toolbar`, `.vcards`, `.vcard`, `.av` and `.chip` are the design's, in
   `ivy/dash.css`. Local: the filter pills and the search field. */
/* Twenty-five trades do not wrap into a readable block, so the row scrolls —
   the same answer the design gives the category strip on a phone. */
.filters-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.filters-row button {
  flex: none;
  padding: 7px 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--card);
  font-size: 14px;
  white-space: nowrap;
  color: var(--ink-2);
}

.filters-row button[aria-pressed='true'] {
  border-color: var(--ivy);
  background: var(--ivy);
  color: var(--on-ivy);
}

.search-field input {
  min-width: 220px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  font-size: 14.5px;
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

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
