<template>
  <div class="vendor-inbox">
    <PageHead :title="t('vendorWork.inbox.title')" :subtitle="t('vendorWork.inbox.subtitle')" />

    <div class="kpis">
      <div class="kpi">
        <span>{{ t('vendorWork.inbox.total') }}</span>
        <strong>{{ metrics?.received ?? '—' }}</strong>
        <small>{{ medianLabel }}</small>
      </div>
      <div :class="['kpi', { danger: count('NEW') > 0 }]">
        <span>{{ t('vendorWork.workflow.NEW') }}</span>
        <strong>{{ count('NEW') }}</strong>
        <small>{{ t('vendorWork.inbox.newNote') }}</small>
      </div>
      <div class="kpi">
        <span>{{ t('vendorWork.workflow.IN_CONVERSATION') }}</span>
        <strong>{{ count('IN_CONVERSATION') }}</strong>
        <small>{{ t('vendorWork.inbox.conversationNote') }}</small>
      </div>
      <div class="kpi">
        <span>{{ t('vendorWork.inbox.fromMicrosite') }}</span>
        <strong>{{ metrics?.bySource?.MICROSITE ?? 0 }}</strong>
        <small>{{ t('vendorWork.inbox.sourceNote') }}</small>
      </div>
    </div>

    <section class="card inbox-card">
      <div class="inbox-toolbar">
        <label class="field wide">
          <span>{{ t('vendorWork.inbox.search') }}</span>
          <input v-model="filters.q" type="search" :placeholder="t('vendorWork.inbox.searchPlaceholder')" />
        </label>
        <label class="field">
          <span>{{ t('vendorWork.inbox.status') }}</span>
          <select v-model="filters.workflow">
            <option value="">{{ t('vendorWork.inbox.allStatuses') }}</option>
            <option v-for="status in WORKFLOW" :key="status" :value="status">{{ t(`vendorWork.workflow.${status}`) }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ t('vendorWork.inbox.source') }}</span>
          <select v-model="filters.source">
            <option value="">{{ t('vendorWork.inbox.allSources') }}</option>
            <option v-for="source in SOURCES" :key="source" :value="source">{{ t(`vendorWork.source.${source}`) }}</option>
          </select>
        </label>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <div class="inbox">
        <div class="list" role="list">
          <p v-if="loading && !items.length" class="empty">{{ t('common.loading') }}</p>
          <p v-else-if="!items.length" class="empty">{{ t('vendorWork.inbox.none') }}</p>
          <button
            v-for="inquiry in items"
            :key="inquiry.id"
            type="button"
            role="listitem"
            :class="['request', { active: inquiry.id === selectedId }]"
            :aria-current="inquiry.id === selectedId ? 'true' : null"
            @click="select(inquiry.id)"
          >
            <span>
              <b>{{ inquiry.organizerName || t('inbox.someone') }}</b>
              <small>{{ [inquiry.eventType, day(inquiry.eventDate), inquiry.location].filter(Boolean).join(' · ') }}</small>
              <small>{{ t(`vendorWork.source.${inquiry.source || 'IVY'}`) }} · {{ day(inquiry.createdAt) }}</small>
            </span>
            <span :class="['pill', TONE[inquiry.workflowStatus]]">{{ t(`vendorWork.workflow.${inquiry.workflowStatus || 'NEW'}`) }}</span>
          </button>
        </div>

        <div v-if="selected" class="detail">
          <div class="detail-head">
            <div>
              <h2>{{ selected.organizerName || t('inbox.someone') }}</h2>
              <span class="muted">{{ t(`vendorWork.source.${selected.source || 'IVY'}`) }} · {{ day(selected.createdAt) }}</span>
            </div>
            <span :class="['pill', TONE[selected.workflowStatus]]">{{ t(`vendorWork.workflow.${selected.workflowStatus || 'NEW'}`) }}</span>
          </div>

          <dl class="facts">
            <div><dt>{{ t('vendorWork.inbox.eventType') }}</dt><dd>{{ selected.eventType || '—' }}</dd></div>
            <div><dt>{{ t('vendorWork.inbox.date') }}</dt><dd>{{ day(selected.eventDate) || '—' }}</dd></div>
            <div><dt>{{ t('vendorWork.inbox.city') }}</dt><dd>{{ selected.location || '—' }}</dd></div>
            <div><dt>{{ t('vendorWork.inbox.guests') }}</dt><dd>{{ selected.guestCount || t('vendorWork.inbox.notGiven') }}</dd></div>
          </dl>

          <ol class="thread">
            <li v-for="message in thread" :key="message.id" :class="['message', message.authorRole === 'VENDOR' ? 'mine' : '']">
              <small>{{ message.authorName || t('inbox.someone') }} · {{ day(message.createdAt) }}</small>
              <p>{{ message.body }}</p>
              <!-- A visitor from the microsite has no account: the e-mail is the
                   only way the reply reaches them, so say whether it went. -->
              <small
                v-if="message.authorRole === 'VENDOR' && selected.source === 'MICROSITE'"
                :class="['delivery', message.emailedAt ? 'sent' : 'unsent']"
                data-testid="reply-delivery"
              >
                {{ message.emailedAt ? t('vendorWork.inbox.emailed') : t('vendorWork.inbox.notEmailed') }}
              </small>
            </li>
            <li v-if="!thread.length && selected.requirements" class="message">
              <p>{{ selected.requirements }}</p>
            </li>
          </ol>

          <form class="reply" @submit.prevent="sendReply">
            <label class="field">
              <span>{{ t('vendorWork.inbox.replyTo', { email: selected.contactEmail || selected.organizerName || '' }) }}</span>
              <textarea v-model="replyBody" rows="4" :placeholder="t('vendorWork.inbox.replyPlaceholder')"></textarea>
            </label>
            <div class="reply-actions">
              <div class="status-actions">
                <template v-if="awaitsDecision">
                  <button type="button" class="btn btn-ghost btn-xs" @click="decide('ACCEPTED')">{{ t('inbox.accept') }}</button>
                  <button type="button" class="btn btn-ghost btn-xs" @click="decide('DECLINED')">{{ t('inbox.decline') }}</button>
                </template>
                <button
                  v-for="status in manualTargets"
                  :key="status"
                  type="button"
                  class="btn btn-ghost btn-xs"
                  @click="moveTo(status)"
                >{{ t(`vendorWork.inbox.markAs.${status}`) }}</button>
              </div>
              <button type="submit" class="btn btn-primary btn-xs" :disabled="!replyBody.trim() || sending">
                {{ t('vendorWork.inbox.send') }}
              </button>
            </div>
            <p class="note">{{ t('vendorWork.inbox.replyNote') }}</p>
          </form>
        </div>
        <p v-else class="detail empty">{{ t('vendorWork.inbox.pick') }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * The vendor's inbox (2026 vendor design, "Барања").
 *
 * <p>A list on the left, the whole inquiry on the right, and the vendor's own
 * pipeline status on every row — new, in conversation, answered, booked. That
 * status is the vendor's bookkeeping, not the organizer's contract: replying
 * moves it to "answered" on the server, and the vendor can move it by hand.
 * Inquiries from the public microsite and from Ivy Events sit side by side,
 * told apart by their source.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import { unwrap, vendorWorkspaceService } from '@/services/vendorWorkspace.service'
import { getErrorMessage } from '@/services/apiError'
import { inquiriesService } from '@/services/inquiries.service'
import { formatDay } from '@/utils/agencyFormat.js'

const WORKFLOW = ['NEW', 'IN_CONVERSATION', 'ANSWERED', 'BOOKED', 'CLOSED']
const SOURCES = ['MICROSITE', 'IVY']
const TONE = { NEW: 'red', IN_CONVERSATION: 'amber', ANSWERED: 'green', BOOKED: 'green', CLOSED: 'slate' }
const SEARCH_DEBOUNCE_MS = 250

const { t, locale } = useI18n()
const route = useRoute()

const filters = reactive({ q: '', workflow: String(route.query.workflow || ''), source: '' })
const items = ref([])
const metrics = ref(null)
const thread = ref([])
const selectedId = ref(route.query.inquiry ? String(route.query.inquiry) : null)
const replyBody = ref('')
const loading = ref(false)
const sending = ref(false)
const error = ref('')

const selected = computed(() => items.value.find((inquiry) => inquiry.id === selectedId.value) || null)

/** The moves the vendor makes by hand — everything but where it already is and "new". */
const manualTargets = computed(() =>
  ['IN_CONVERSATION', 'BOOKED', 'CLOSED'].filter((status) => status !== selected.value?.workflowStatus),
)

const count = (status) => metrics.value?.byWorkflow?.[status] ?? 0

const medianLabel = computed(() =>
  metrics.value?.medianMinutes == null
    ? t('vendorWork.inbox.noMedian')
    : t('vendorWork.inbox.median', { time: humanMinutes(metrics.value.medianMinutes) }),
)

const day = (value) => (value ? formatDay(value, locale.value) : '')

async function loadList() {
  loading.value = true
  error.value = ''
  try {
    items.value = unwrap(await vendorWorkspaceService.inbox({ ...filters })) ?? []
    if (!items.value.some((inquiry) => inquiry.id === selectedId.value)) {
      selectedId.value = items.value[0]?.id ?? null
    }
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}

async function loadMetrics() {
  try {
    metrics.value = unwrap(await vendorWorkspaceService.metrics())
  } catch {
    metrics.value = null
  }
}

async function loadThread() {
  thread.value = []
  if (!selectedId.value) return
  try {
    thread.value = unwrap(await vendorWorkspaceService.thread(selectedId.value)) ?? []
  } catch {
    thread.value = []
  }
}

function select(id) {
  selectedId.value = id
  replyBody.value = ''
}

async function sendReply() {
  const body = replyBody.value.trim()
  if (!body || !selected.value) return
  sending.value = true
  error.value = ''
  try {
    await vendorWorkspaceService.reply(selected.value.id, body)
    replyBody.value = ''
    await Promise.all([loadList(), loadMetrics(), loadThread()])
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    sending.value = false
  }
}

/**
 * An inquiry sent through Ivy Events waits for the vendor's decision on the
 * organizer's side as well. Microsite inquiries have nobody signed in to
 * receive one, so they get the pipeline alone.
 */
const awaitsDecision = computed(() => selected.value?.source === 'IVY' && selected.value?.status === 'SENT')

async function decide(decision) {
  if (!selected.value) return
  error.value = ''
  try {
    await inquiriesService.respond(selected.value.id, decision, replyBody.value.trim() || null)
    replyBody.value = ''
    await Promise.all([loadList(), loadMetrics(), loadThread()])
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}

async function moveTo(status) {
  if (!selected.value) return
  error.value = ''
  try {
    const updated = unwrap(await vendorWorkspaceService.setWorkflow(selected.value.id, status))
    items.value = items.value.map((inquiry) => (inquiry.id === updated.id ? { ...inquiry, ...updated } : inquiry))
    await loadMetrics()
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}

function humanMinutes(minutes) {
  if (minutes < 60) return t('vendorWork.inbox.minutes', { n: minutes })
  const hours = Math.round(minutes / 60)
  return hours < 48 ? t('vendorWork.inbox.hours', { n: hours }) : t('vendorWork.inbox.days', { n: Math.round(hours / 24) })
}

let searchTimer
watch(() => filters.q, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadList, SEARCH_DEBOUNCE_MS)
})
watch(() => [filters.workflow, filters.source], loadList)
watch(selectedId, loadThread)
// The top-bar search opens an inquiry by link, also while the inbox is showing.
watch(() => route.query.inquiry, (id) => {
  if (id) selectedId.value = String(id)
})

onMounted(async () => {
  await Promise.all([loadList(), loadMetrics()])
  await loadThread()
})
</script>

<style scoped src="../../components/agency/agency-panels.css"></style>

<style scoped>
.kpi.danger strong {
  color: var(--rose-ink);
}

/* The site's buttons are 42px and up; the inbox needs a row of small ones. */
.btn-xs {
  min-height: 34px;
  padding: 0 12px;
  font-size: 13px;
}

.inbox-card {
  padding: 0;
  overflow: hidden;
}

.inbox-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-end;
  padding: 14px 18px;
  border-bottom: 1px solid var(--line);
  background: var(--mist-2);
}

.field {
  flex: 1;
  min-width: 150px;
}

.field.wide {
  flex: 2;
  min-width: 220px;
}

.field > span {
  display: block;
  margin-bottom: 5px;
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 600;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  min-height: 36px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  color: var(--ink);
  font: inherit;
  font-size: 13.5px;
}

.inbox {
  display: grid;
  grid-template-columns: minmax(300px, 0.8fr) minmax(0, 1.2fr);
  min-height: 460px;
}

.list {
  border-right: 1px solid var(--line);
}

.request {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 14px 18px;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: none;
  text-align: left;
  color: inherit;
}

.request:hover,
.request.active {
  background: var(--mist-2);
}

.request > .pill {
  align-self: flex-start;
}

.request b {
  font-size: 14px;
  font-weight: 600;
}

.request small {
  display: block;
  margin-top: 3px;
  color: var(--ink-3);
  font-size: 12.5px;
}

.detail {
  padding: 22px;
  min-width: 0;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.detail-head h2 {
  margin: 0 0 4px;
  font-size: 22px;
}

.muted {
  color: var(--ink-3);
  font-size: 12.5px;
}

.facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 16px 0;
}

.facts div {
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.facts dt {
  color: var(--ink-3);
  font-size: 12px;
}

.facts dd {
  margin: 3px 0 0;
  font-weight: 600;
  font-size: 14px;
}

.thread {
  list-style: none;
  margin: 0 0 14px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--mist-2);
}

.message.mine {
  background: var(--mist);
  margin-left: 32px;
}

.message small {
  color: var(--ink-3);
  font-size: 12px;
}

.message small.delivery {
  display: block;
  margin-top: 6px;
}

.message small.delivery.unsent {
  color: var(--amber-ink, #8a5a12);
}

.message p {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-line;
}

.reply {
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.status-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.note {
  margin: 10px 0 0;
  color: var(--ink-3);
  font-size: 12px;
}

.error {
  padding: 10px 18px 0;
  color: var(--rose-ink);
}

@media (max-width: 860px) {
  .inbox {
    grid-template-columns: 1fr;
  }

  .list {
    max-height: 280px;
    overflow: auto;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
}
</style>
