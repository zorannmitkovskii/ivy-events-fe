<template>
  <div class="inbox">
    <header class="head">
      <div>
        <h1>{{ t('inbox.title') }}</h1>
        <p class="sub">{{ t('inbox.subtitle') }}</p>
      </div>

      <!-- The unanswered count sits next to the median on purpose: "two hours"
           from the three they replied to, while nine wait, is a number that
           flatters. -->
      <dl v-if="metrics" class="metrics">
        <div>
          <dt>{{ t('inbox.median') }}</dt>
          <dd>{{ metrics.medianMinutes == null ? '—' : formatMinutes(metrics.medianMinutes) }}</dd>
        </div>
        <div>
          <dt>{{ t('inbox.unanswered') }}</dt>
          <dd :class="{ warn: metrics.unanswered > 0 }">{{ metrics.unanswered }}</dd>
        </div>
      </dl>
    </header>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="loading" class="state">{{ t('directory.loading') }}</p>
    <p v-else-if="!items.length" class="state">{{ t('inbox.empty') }}</p>

    <ul v-else class="list">
      <li v-for="inquiry in items" :key="inquiry.id" :class="{ waiting: isWaiting(inquiry) }">
        <button class="summary" @click="open(inquiry)">
          <span class="who">{{ inquiry.organizerName || t('inbox.someone') }}</span>
          <span class="what">
            {{ inquiry.eventDate ? formatDate(inquiry.eventDate) : t('inbox.noDate') }}
            <template v-if="inquiry.guestCount"> · {{ t('inbox.guests', { n: inquiry.guestCount }) }}</template>
            <template v-if="inquiry.budgetMin"> · {{ formatBudget(inquiry) }}</template>
          </span>
          <span class="badge" :class="inquiry.status.toLowerCase()">
            {{ t(`inbox.status.${inquiry.status}`) }}
          </span>
        </button>

        <section v-if="openId === inquiry.id" class="detail">
          <p v-if="inquiry.location" class="line">{{ t('inbox.where') }}: {{ inquiry.location }}</p>
          <p v-if="inquiry.contactPhone" class="line">
            <a :href="`tel:${inquiry.contactPhone}`">{{ inquiry.contactPhone }}</a>
          </p>

          <ul class="thread">
            <li v-for="message in thread" :key="message.id" :class="message.authorRole.toLowerCase()">
              <span class="author">{{ message.authorName || t('inbox.someone') }}</span>
              <p class="body">{{ message.body }}</p>
              <a v-if="message.attachmentKey" :href="attachmentHref(message)" target="_blank" rel="noopener">
                {{ message.attachmentName || t('inbox.attachment') }}
              </a>
            </li>
          </ul>

          <form class="reply" @submit.prevent="sendReply(inquiry)">
            <textarea v-model="replyBody" rows="2" :placeholder="t('inbox.replyPlaceholder')"></textarea>
            <input type="file" @change="onFile" />
            <button class="btn" type="submit" :disabled="!replyBody.trim() && !replyFile">
              {{ t('inbox.send') }}
            </button>
          </form>

          <div v-if="inquiry.status === 'SENT'" class="decisions">
            <button class="btn" @click="decide(inquiry, 'ACCEPTED')">{{ t('inbox.accept') }}</button>
            <button class="link-btn" @click="decide(inquiry, 'QUESTION_ASKED')">
              {{ t('inbox.askQuestion') }}
            </button>
            <button class="link-btn danger" @click="decide(inquiry, 'DECLINED')">
              {{ t('inbox.decline') }}
            </button>
          </div>
        </section>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { inquiriesService } from '@/services/inquiries.service'
import { baseUrl } from '@/services/baseUrl'

const { t, locale } = useI18n()

const items = ref([])
const metrics = ref(null)
const thread = ref([])
const openId = ref(null)
const replyBody = ref('')
const replyFile = ref(null)
const loading = ref(true)
const error = ref('')

function unwrap(response) {
  return response?.data ?? response ?? null
}

onMounted(load)

async function load() {
  loading.value = true
  try {
    const [inbox, stats] = await Promise.all([
      inquiriesService.inbox(),
      inquiriesService.metrics(),
    ])
    items.value = unwrap(inbox) || []
    metrics.value = unwrap(stats)
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  } finally {
    loading.value = false
  }
}

async function open(inquiry) {
  if (openId.value === inquiry.id) {
    openId.value = null
    return
  }
  openId.value = inquiry.id
  thread.value = []

  try {
    thread.value = unwrap(await inquiriesService.thread(inquiry.id)) || []
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function sendReply(inquiry) {
  error.value = ''
  try {
    await inquiriesService.reply(inquiry.id, {
      body: replyBody.value.trim(),
      file: replyFile.value,
    })
    replyBody.value = ''
    replyFile.value = null
    thread.value = unwrap(await inquiriesService.thread(inquiry.id)) || []
    // A reply is the vendor's first response, so the metrics moved.
    await load()
    openId.value = inquiry.id
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function decide(inquiry, decision) {
  error.value = ''
  try {
    await inquiriesService.respond(inquiry.id, decision, null)
    await load()
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

function onFile(event) {
  replyFile.value = event.target.files?.[0] || null
}

/** Waiting on the vendor, which is what the list should surface first. */
function isWaiting(inquiry) {
  return inquiry.status === 'SENT' && !inquiry.firstResponseAt
}

function formatMinutes(minutes) {
  if (minutes < 60) return t('inbox.minutes', { n: minutes })
  const hours = Math.round(minutes / 60)
  return hours < 48 ? t('inbox.hours', { n: hours }) : t('inbox.days', { n: Math.round(hours / 24) })
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(locale.value, { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatBudget(inquiry) {
  const max = inquiry.budgetMax ? `–${inquiry.budgetMax}` : ''
  return `${inquiry.budgetMin}${max} МКД`
}

function attachmentHref(message) {
  return `${baseUrl}/v1/api/public/images/${encodeURIComponent(message.attachmentKey)}`
}
</script>

<style scoped>
.inbox { display: flex; flex-direction: column; gap: 16px; padding: 4px; max-width: 760px; }

.head { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; align-items: flex-start; }
.head h1 { margin: 0; font-size: 22px; }
.sub { margin: 4px 0 0; font-size: 13px; color: #6b6b6b; }

.metrics { display: flex; gap: 20px; margin: 0; }
.metrics dt { font-size: 11.5px; color: #8a8a8a; }
.metrics dd { margin: 2px 0 0; font-size: 18px; font-weight: 600; }
.metrics dd.warn { color: #a3271f; }

.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.list li { border: 1px solid #ece8e0; border-radius: 10px; background: #fff; overflow: hidden; }
.list li.waiting { border-left: 3px solid #a3271f; }

.summary { width: 100%; display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap;
  padding: 14px; background: none; border: 0; cursor: pointer; text-align: left; }
.who { font-weight: 600; }
.what { flex: 1; font-size: 13px; color: #6b6b6b; }

.badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #f0efe9; }
.badge.accepted { background: #e6f2e2; color: #2f6b28; }
.badge.declined { background: #fdeceb; color: #a3271f; }
.badge.sent { background: #fbf1dc; color: #8f6d1f; }

.detail { padding: 0 14px 14px; }
.line { margin: 0 0 6px; font-size: 13.5px; }

.thread { list-style: none; margin: 10px 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.thread li { padding: 10px 12px; border-radius: 8px; background: #faf8f4; }
.thread li.vendor { background: #f3f7f1; }
.thread .author { font-size: 11.5px; color: #8a8a8a; }
.thread .body { margin: 4px 0 0; font-size: 14px; white-space: pre-wrap; }

.reply { display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap; }
.reply textarea { flex: 1 1 240px; padding: 8px 10px; border: 1px solid #ddd8cf;
  border-radius: 8px; font-family: inherit; font-size: 14px; }

.decisions { display: flex; gap: 14px; align-items: center; margin-top: 12px; }

.btn { padding: 8px 16px; border: 0; border-radius: 8px; background: var(--brand); color: #fff;
  font-size: 14px; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: default; }
.link-btn { border: 0; background: none; color: var(--brand); cursor: pointer; font-size: 13px; }
.link-btn.danger { color: #a3271f; }

.state { color: #6b6b6b; }
.error { font-size: 13px; color: #a3271f; }
</style>
