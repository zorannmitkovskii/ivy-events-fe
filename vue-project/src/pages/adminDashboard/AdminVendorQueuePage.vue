<template>
  <div class="queue">
    <header class="head">
      <h1>{{ t('vendorQueue.title') }}</h1>
      <p class="sub">{{ t('vendorQueue.subtitle') }}</p>
    </header>

    <p v-if="loading" class="state">{{ t('directory.loading') }}</p>
    <p v-else-if="!items.length" class="state">{{ t('vendorQueue.empty') }}</p>

    <ul v-else class="applications">
      <li v-for="vendor in items" :key="vendor.id">
        <div class="summary">
          <h2>{{ vendor.name }}</h2>
          <p class="meta">
            {{ readable(vendor.type) }}
            <template v-if="vendor.city"> · {{ vendor.city }}</template>
            · {{ t('vendorApp.complete', { n: vendor.completeness }) }}
          </p>
          <p v-if="vendor.description" class="description">{{ vendor.description }}</p>

          <!-- The whole profile, so a decision is made on what was actually
               filled in rather than on a name and a category. -->
          <dl class="fields">
            <div v-for="field in filledFields(vendor)" :key="field.key">
              <dt>{{ readable(field.key) }}</dt>
              <dd>{{ vendor.values[field.key] }}</dd>
            </div>
          </dl>
        </div>

        <div class="decision">
          <button class="btn" @click="decide(vendor, 'APPROVED')">
            {{ t('vendorQueue.approve') }}
          </button>

          <label class="field">
            <span>{{ t('vendorQueue.note') }}</span>
            <input v-model="notes[vendor.id]" type="text" />
          </label>

          <button class="link-btn" @click="decide(vendor, 'CHANGES_REQUESTED')">
            {{ t('vendorQueue.requestChanges') }}
          </button>
          <button class="link-btn danger" @click="decide(vendor, 'REJECTED')">
            {{ t('vendorQueue.reject') }}
          </button>
        </div>
      </li>
    </ul>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { vendorApplicationService } from '@/services/vendorDirectory.service'

const { t } = useI18n()

const items = ref([])
const notes = reactive({})
const loading = ref(true)
const error = ref('')

onMounted(load)

async function load() {
  loading.value = true
  try {
    const response = await vendorApplicationService.queue()
    items.value = response?.data ?? response ?? []
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  } finally {
    loading.value = false
  }
}

async function decide(vendor, decision) {
  error.value = ''
  try {
    await vendorApplicationService.decide(vendor.id, decision, notes[vendor.id])
    delete notes[vendor.id]
    await load()
  } catch (e) {
    // The server refuses "changes requested" with no note, and says so — that
    // message is more useful than anything this page could invent.
    error.value = e?.detail || e?.message || ''
  }
}

const SHOWN_ELSEWHERE = ['name', 'description', 'city']

function filledFields(vendor) {
  return vendor.fields.filter(field =>
    !SHOWN_ELSEWHERE.includes(field.key) && vendor.values[field.key])
}

function readable(value) {
  return (value || '').toLowerCase().replace(/_/g, ' ')
}
</script>

<style scoped>
.queue { display: flex; flex-direction: column; gap: 16px; padding: 4px; }
.head h1 { margin: 0; font-size: 22px; }
.sub { margin: 4px 0 0; font-size: 13px; color: #6b6b6b; }

.applications { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.applications li {
  display: flex; gap: 20px; flex-wrap: wrap;
  padding: 16px; border-radius: 10px; background: #fff; border: 1px solid #ece8e0;
}

.summary { flex: 1 1 380px; }
.summary h2 { margin: 0; font-size: 17px; }
.meta { margin: 4px 0 0; font-size: 12.5px; color: #8a8a8a; }
.description { margin: 10px 0 0; font-size: 14px; }

.fields { margin: 12px 0 0; display: grid; gap: 8px 20px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.fields dt { font-size: 11.5px; color: #8a8a8a; }
.fields dd { margin: 2px 0 0; font-size: 13.5px; }

.decision { display: flex; flex-direction: column; gap: 10px; min-width: 220px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; }
.field input { padding: 7px 10px; border: 1px solid #ddd8cf; border-radius: 8px; font-size: 13px; }

.btn { padding: 9px 16px; border: 0; border-radius: 8px; background: var(--brand);
  color: #fff; font-size: 14px; cursor: pointer; }
.link-btn { border: 0; background: none; color: var(--brand); cursor: pointer;
  font-size: 13px; padding: 0; text-align: left; }
.link-btn.danger { color: #a3271f; }

.state { color: #6b6b6b; }
.error { font-size: 13px; color: #a3271f; }
</style>
