<template>
  <div ref="root" class="wsearch">
    <!-- The design's `.search` pill, with a real field in it. -->
    <div class="search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.5-4.5" />
      </svg>
      <input
        v-model="query"
        class="wsearch-input"
        type="search"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        :aria-label="placeholder || t('workspaceSearch.label')"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="listId"
        :aria-activedescendant="activeId"
        :placeholder="placeholder || t('workspaceSearch.label')"
        @keydown="onKeydown"
        @focus="reopen"
      />
    </div>

    <div v-if="open" :id="listId" class="wsearch-panel" role="listbox" :aria-label="t('workspaceSearch.results')">
      <p v-if="loading && !hits.length" class="wsearch-note">{{ t('common.loading') }}</p>
      <p v-else-if="!hits.length" class="wsearch-note">{{ t('workspaceSearch.noResults') }}</p>

      <template v-for="group in groups" :key="group.kind">
        <div role="group" :aria-labelledby="`${listId}-${group.kind}`">
          <p :id="`${listId}-${group.kind}`" class="wsearch-kind">{{ t(`workspaceSearch.kinds.${group.kind}`) }}</p>
          <div
            v-for="entry in group.entries"
            :id="optionId(entry.index)"
            :key="entry.hit.id"
            class="wsearch-option"
            :class="{ 'wsearch-active': entry.index === active }"
            role="option"
            :aria-selected="entry.index === active ? 'true' : 'false'"
            @mousedown.prevent="choose(entry.hit)"
            @mousemove="active = entry.index"
          >
            <span class="wsearch-title">{{ entry.hit.title }}</span>
            <small v-if="entry.hit.subtitle" class="wsearch-sub">{{ entry.hit.subtitle }}</small>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * The console top-bar search: a combobox over whatever the workspace searches.
 *
 * <p>It knows nothing about agencies or vendors. The layout hands it the call
 * to make and decides where a chosen hit leads, so one component serves both
 * consoles and the routing rules live next to the routes.
 *
 * @param search q → Promise of hits `{kind, id, title, subtitle, eventId?}`
 * @emits select the chosen hit
 */
const props = defineProps({
  search: { type: Function, required: true },
  placeholder: { type: String, default: '' },
})

const emit = defineEmits(['select'])

/** Matches the server: one letter matches every row, so it is not sent. */
const MIN_QUERY = 2
const DEBOUNCE_MS = 250
/** The order kinds are grouped in — what someone is most likely looking for first. */
const KIND_ORDER = ['EVENT', 'TASK', 'LEAD', 'INQUIRY', 'BOOKING', 'PACKAGE']

const { t } = useI18n()

const root = ref(null)
const query = ref('')
const hits = ref([])
const loading = ref(false)
const open = ref(false)
const active = ref(-1)
const listId = `wsearch-${Math.random().toString(36).slice(2, 9)}`

let timer = null
/** Only the latest request may fill the list; an older, slower one is dropped. */
let latest = 0

/** Hits grouped by kind, each carrying its position in the flat keyboard order. */
const groups = computed(() => {
  let index = 0
  return KIND_ORDER
    .map((kind) => ({ kind, entries: hits.value.filter((hit) => hit.kind === kind) }))
    .filter((group) => group.entries.length)
    .map((group) => ({ kind: group.kind, entries: group.entries.map((hit) => ({ hit, index: index++ })) }))
})

const ordered = computed(() => groups.value.flatMap((group) => group.entries.map((entry) => entry.hit)))

const activeId = computed(() => (open.value && active.value >= 0 ? optionId(active.value) : undefined))

function optionId(index) {
  return `${listId}-opt-${index}`
}

async function run(q) {
  const ticket = ++latest
  loading.value = true
  try {
    const found = await props.search(q)
    if (ticket !== latest) return
    hits.value = Array.isArray(found) ? found : []
  } catch {
    if (ticket === latest) hits.value = []
  } finally {
    if (ticket === latest) {
      loading.value = false
      active.value = hits.value.length ? 0 : -1
    }
  }
}

watch(query, (value) => {
  clearTimeout(timer)
  const q = value.trim()
  if (q.length < MIN_QUERY) {
    latest++
    hits.value = []
    loading.value = false
    open.value = false
    return
  }
  open.value = true
  timer = setTimeout(() => run(q), DEBOUNCE_MS)
})

function reopen() {
  if (query.value.trim().length >= MIN_QUERY) open.value = true
}

function close() {
  open.value = false
  active.value = -1
}

function choose(hit) {
  emit('select', hit)
  query.value = ''
  close()
}

function move(step) {
  const count = ordered.value.length
  if (!count) return
  active.value = (active.value + step + count) % count
}

function onKeydown(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!open.value) reopen()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Enter') {
    const hit = ordered.value[active.value]
    if (open.value && hit) {
      event.preventDefault()
      choose(hit)
    }
  } else if (event.key === 'Escape') {
    if (open.value) close()
    else query.value = ''
  }
}

function onClickOutside(event) {
  if (root.value && !root.value.contains(event.target)) close()
}

onMounted(() => document.addEventListener('click', onClickOutside))

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  clearTimeout(timer)
})
</script>

<style scoped>
/* `.search` is the design's pill in `ivy/dash.css`; everything else is local
   and prefixed, because `.search`, `.empty` and friends are global there. */
.wsearch {
  position: relative;
}

.wsearch-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  outline: none;
}

.wsearch-input::placeholder {
  color: var(--ink-3);
}

.wsearch-input::-webkit-search-cancel-button {
  display: none;
}

.wsearch .search:focus-within {
  border-color: var(--ivy);
}

.wsearch-panel {
  position: absolute;
  z-index: 40;
  top: calc(100% + 8px);
  left: 0;
  width: max(100%, 340px);
  max-height: 420px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--card);
  box-shadow: var(--shadow);
}

.wsearch-note {
  margin: 0;
  padding: 20px 12px;
  text-align: center;
  font-size: 14px;
  color: var(--ink-3);
}

.wsearch-kind {
  margin: 8px 10px 4px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.wsearch-option {
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
}

.wsearch-option.wsearch-active {
  background: var(--mist);
}

.wsearch-title {
  font-size: 14.5px;
  color: var(--ink);
}

.wsearch-sub {
  font-size: 12.5px;
  color: var(--ink-3);
}
</style>
