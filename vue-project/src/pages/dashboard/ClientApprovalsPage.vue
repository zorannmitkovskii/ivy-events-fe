<template>
  <div class="approvals-page">
    <PageHeader :title="t('approvals.title')">
      <template #actions>
        <p class="sub">{{ t('approvals.subtitle') }}</p>
      </template>
    </PageHeader>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <form class="composer" @submit.prevent="ask">
      <input v-model="draft.subjectKey" type="text" :placeholder="t('approvals.subject')" maxlength="120" required />
      <input v-model="draft.title" type="text" :placeholder="t('approvals.subjectTitle')" maxlength="200" required />
      <input v-model="draft.dueDate" type="date" :aria-label="t('approvals.due')" />
      <textarea v-model="draft.description" rows="2" :placeholder="t('approvals.description')"></textarea>
      <button class="btn" type="submit" :disabled="!canAsk">{{ t('approvals.ask') }}</button>
    </form>

    <!-- A second live question about the same thing is a client answering the
         wrong one, so asking again replaces rather than adds. -->
    <p class="hint">{{ t('approvals.supersedeHint') }}</p>

    <ul class="list">
      <li v-for="item in items" :key="item.id" :class="statusClass(item)">
        <div class="item-head">
          <span class="item-title">{{ item.title }}</span>
          <span class="badges">
            <span class="badge">{{ item.subjectKey }} v{{ item.version }}</span>
            <span class="badge" :class="item.status.toLowerCase()">
              {{ t(`approvals.status${item.status}`) }}
            </span>
            <span v-if="item.supersededAt" class="badge muted">{{ t('approvals.superseded') }}</span>
            <span v-else-if="isOverdue(item)" class="badge warn">{{ t('approvals.overdue') }}</span>
          </span>
        </div>

        <p v-if="item.description" class="item-body">{{ item.description }}</p>

        <p v-if="item.decidedAt" class="meta">
          {{ t('approvals.decidedBy', { who: item.decidedBy, when: day(item.decidedAt) }) }}
          <span v-if="item.decisionComment"> — {{ item.decisionComment }}</span>
        </p>
        <p v-else-if="item.dueDate" class="meta">{{ t('approvals.dueOn', { date: item.dueDate }) }}</p>

        <div v-if="isOpen(item)" class="actions">
          <input v-model="comments[item.id]" type="text"
                 :placeholder="t('approvals.comment')" maxlength="1000" />
          <button class="link-btn" @click="decide(item, 'APPROVED')">{{ t('approvals.approve') }}</button>
          <!-- A rejection with no comment is a message that says "no" and
               starts a phone call, so the button waits for one. -->
          <button class="link-btn danger"
                  :disabled="!(comments[item.id] || '').trim()"
                  @click="decide(item, 'REJECTED')">
            {{ t('approvals.reject') }}
          </button>
        </div>
      </li>
    </ul>

    <EmptyState v-if="!items.length" tone="no-results" :title="t('approvals.empty')" />
  </div>
</template>

<script setup>
import EmptyState from '@/components/ui/EmptyState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { crmService } from '@/services/crm.service'
import { getErrorMessage } from '@/services/apiError'
import { useAuthUser } from '@/composables/useAuthUser'

const { t } = useI18n()
const { eventId: currentEventId } = useAuthUser()
const eventId = currentEventId.value

const items = ref([])
const comments = reactive({})
const error = ref('')

const draft = reactive({ subjectKey: '', title: '', description: '', dueDate: '' })

const canAsk = computed(() => draft.subjectKey.trim() && draft.title.trim())

function unwrap(response) {
  return response?.data ?? response ?? null
}

const isOpen = (item) => item.status === 'PENDING' && !item.supersededAt

function isOverdue(item) {
  return isOpen(item) && item.dueDate && item.dueDate < new Date().toISOString().slice(0, 10)
}

const statusClass = (item) => ({
  answered: item.status !== 'PENDING',
  inactive: !!item.supersededAt,
})

const day = (iso) => new Date(iso).toLocaleDateString()

onMounted(load)

async function load() {
  try {
    items.value = unwrap(await crmService.approvals(eventId)) || []
    error.value = ''
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}

async function ask() {
  try {
    await crmService.requestApproval(eventId, {
      subjectKey: draft.subjectKey.trim(),
      title: draft.title.trim(),
      description: draft.description,
      dueDate: draft.dueDate || null,
    })
    Object.keys(draft).forEach((key) => { draft[key] = '' })
    await load()
  } catch (failure) {
    // Reload first, then say why: clearing the message after a reload is how a
    // refusal ends up in the console and never on the screen.
    await load()
    error.value = getErrorMessage(failure)
  }
}

async function decide(item, decision) {
  try {
    await crmService.decide(item.id, decision, comments[item.id] || null)
    comments[item.id] = ''
    await load()
  } catch (failure) {
    await load()
    error.value = getErrorMessage(failure)
  }
}
</script>

<style scoped>
.approvals-page { padding: 1.5rem; max-width: 800px; }
.page-head h1 { margin: 0; font-size: 1.5rem; }
.sub { color: #666; margin: 0.25rem 0 1rem; }
.error { color: #b3261e; }
.hint { color: #777; font-size: 0.85rem; }
.composer { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.composer input, .composer textarea { padding: 0.45rem 0.6rem; border: 1px solid #ddd; border-radius: 6px; flex: 1 1 180px; }
.list { list-style: none; padding: 0; }
.list li { border: 1px solid #eee; border-radius: 8px; padding: 0.7rem; margin-bottom: 0.5rem; background: #fff; }
.list li.inactive { opacity: 0.6; }
.item-head { display: flex; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; }
.item-title { font-weight: 600; }
.badges { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.badge { font-size: 0.72rem; padding: 0.1rem 0.4rem; border-radius: 4px; background: #eee; }
.badge.approved { background: #dceedd; }
.badge.rejected { background: #f7dcda; }
.badge.warn { background: #f6e6c8; }
.badge.muted { color: #888; }
.item-body { margin: 0.35rem 0; font-size: 0.9rem; }
.meta { margin: 0.2rem 0; font-size: 0.85rem; color: #555; }
.actions { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.4rem; flex-wrap: wrap; }
.actions input { flex: 1 1 200px; padding: 0.35rem 0.5rem; border: 1px solid #ddd; border-radius: 6px; }
.btn { padding: 0.45rem 0.9rem; border: 0; border-radius: 6px; background: var(--brand); color: #fff; cursor: pointer; }
.link-btn { background: none; border: 0; color: var(--brand); cursor: pointer; padding: 0; font-size: 0.85rem; }
.link-btn.danger { color: #b3261e; }
.link-btn:disabled { color: #bbb; cursor: default; }
</style>
