<template>
  <div class="pipeline-page">
    <PageHeader :title="t('crm.title')">
      <template #actions>
        <p class="sub">{{ t('crm.subtitle') }}</p>
      </template>
    </PageHeader>

    <!--
      Before the board, not after it. A pipeline sorted by stage answers "what
      did we get?"; these two answer "what are we dropping?", which is the
      question that costs money.
    -->
    <section v-if="overdue.length || missingNextAction.length" class="attention">
      <p v-if="overdue.length" class="warn">
        {{ t('crm.overdue', { count: overdue.length }) }}
      </p>
      <p v-if="missingNextAction.length" class="warn muted">
        {{ t('crm.noNextAction', { count: missingNextAction.length }) }}
      </p>
    </section>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <form class="composer" @submit.prevent="addLead">
      <input v-model="draft.name" type="text" :placeholder="t('crm.name')" maxlength="160" required />
      <input v-model="draft.contactEmail" type="email" :placeholder="t('crm.email')" />
      <input v-model="draft.source" type="text" :placeholder="t('crm.source')" maxlength="80" />
      <input v-model="draft.nextAction" type="text" :placeholder="t('crm.nextAction')" maxlength="200" />
      <input v-model="draft.nextActionAt" type="date" :aria-label="t('crm.nextActionAt')" />
      <button class="btn" type="submit" :disabled="!draft.name.trim()">{{ t('crm.add') }}</button>
    </form>

    <div class="board">
      <section v-for="stage in LEAD_STAGES" :key="stage" class="column">
        <h2>
          {{ t(`crm.stage${stage}`) }}
          <span class="count">{{ byStage[stage].length }}</span>
        </h2>

        <article v-for="lead in byStage[stage]" :key="lead.id" class="card">
          <p class="lead-name">{{ lead.name }}</p>
          <p v-if="lead.source" class="meta">{{ lead.source }}</p>
          <p v-if="lead.nextAction" class="meta" :class="{ due: isDue(lead) }">
            {{ lead.nextAction }}
            <span v-if="lead.nextActionAt"> · {{ lead.nextActionAt }}</span>
          </p>
          <p v-else-if="isOpen(lead)" class="meta muted">{{ t('crm.noAction') }}</p>

          <!--
            The fee and the budget are shown as two lines and never summed. An
            agency that adds them believes it is five times its size.
          -->
          <p v-if="lead.expectedValue" class="fee">
            {{ t('crm.fee') }}: {{ money(lead.expectedValue) }}
          </p>

          <p v-if="lead.lostReason" class="meta muted">
            {{ t(`crm.lost${lead.lostReason}`) }}
            <span v-if="lead.lostNote"> — {{ lead.lostNote }}</span>
          </p>

          <div v-if="isOpen(lead)" class="actions">
            <select
              :value="lead.stage"
              :disabled="busyLeadId === lead.id"
              :aria-label="t('crm.moveTo')"
              @change="onMove(lead, $event.target.value)"
            >
              <option v-for="option in MOVABLE" :key="option" :value="option">
                {{ t(`crm.stage${option}`) }}
              </option>
            </select>
            <button class="link-btn" :disabled="busyLeadId === lead.id" @click="onWin(lead)">
              {{ t('crm.win') }}
            </button>
            <button class="link-btn" :disabled="busyLeadId === lead.id" @click="startLosing(lead)">
              {{ t('crm.lose') }}
            </button>
          </div>

          <router-link v-else-if="lead.convertedEventId" class="link-btn"
                       :to="`/dashboard/overview?eventId=${lead.convertedEventId}`">
            {{ t('crm.openEvent') }}
          </router-link>
        </article>

        <EmptyState v-if="!byStage[stage].length" tone="no-results" :title="t('crm.emptyColumn')" />
      </section>
    </div>

    <!-- A loss with no reason teaches nobody anything, so the reason is asked
         for rather than assumed. -->
    <form v-if="losing" class="lose-form" @submit.prevent="confirmLoss">
      <h3>{{ t('crm.loseHeading', { name: losing.name }) }}</h3>
      <select v-model="lossReason" :aria-label="t('crm.lostReason')">
        <option v-for="reason in LOST_REASONS" :key="reason" :value="reason">
          {{ t(`crm.lost${reason}`) }}
        </option>
      </select>
      <input v-model="lossNote" type="text" :placeholder="t('crm.lostNote')" maxlength="300" />
      <button class="btn" type="submit">{{ t('crm.confirmLoss') }}</button>
      <button class="link-btn" type="button" @click="losing = null">{{ t('common.cancel') }}</button>
    </form>
  </div>
</template>

<script setup>
import EmptyState from '@/components/ui/EmptyState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useLeadPipeline, { LEAD_STAGES } from '@/composables/useLeadPipeline'

/** WON and LOST are reached through their own actions — winning creates an
 *  event and losing asks for a reason, and neither is a dropdown change. */
const MOVABLE = ['INQUIRY', 'CONSULTATION', 'PROPOSAL']

const LOST_REASONS = ['PRICE', 'AVAILABILITY', 'COMPETITOR', 'CANCELLED', 'NO_RESPONSE', 'OTHER']

const { t } = useI18n()
const {
  byStage, overdue, missingNextAction, error, busyLeadId,
  load, create, moveTo, win, lose,
} = useLeadPipeline()

const draft = reactive({
  name: '', contactEmail: '', source: '', nextAction: '', nextActionAt: '',
})

const losing = ref(null)
const lossReason = ref('PRICE')
const lossNote = ref('')

onMounted(load)

const isOpen = (lead) => lead.stage !== 'WON' && lead.stage !== 'LOST'

function isDue(lead) {
  return isOpen(lead) && lead.nextActionAt
    && lead.nextActionAt <= new Date().toISOString().slice(0, 10)
}

function money(amount) {
  return new Intl.NumberFormat('mk-MK', { maximumFractionDigits: 0 }).format(amount)
}

async function addLead() {
  const created = await create({ ...draft, nextActionAt: draft.nextActionAt || null })
  if (created) {
    Object.keys(draft).forEach((key) => { draft[key] = '' })
  }
}

const onMove = (lead, stage) => moveTo(lead.id, stage)
const onWin = (lead) => win(lead.id)

function startLosing(lead) {
  losing.value = lead
  lossReason.value = 'PRICE'
  lossNote.value = ''
}

async function confirmLoss() {
  await lose(losing.value.id, lossReason.value, lossNote.value)
  losing.value = null
}
</script>

<style scoped>
.pipeline-page { padding: 1.5rem; }
.page-head h1 { margin: 0; font-size: 1.5rem; }
.sub { color: #666; margin: 0.25rem 0 1rem; }
.attention { margin-bottom: 1rem; }
.warn { margin: 0.15rem 0; color: #8a5300; font-weight: 600; }
.warn.muted { color: #666; font-weight: 400; }
.error { color: #b3261e; margin: 0.5rem 0; }
.composer { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem; }
.composer input { padding: 0.45rem 0.6rem; border: 1px solid #ddd; border-radius: 6px; }
.board { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
.column h2 { font-size: 0.95rem; margin: 0 0 0.5rem; display: flex; justify-content: space-between; }
.count { color: #888; font-weight: 400; }
.card { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 0.6rem; margin-bottom: 0.5rem; }
.lead-name { margin: 0 0 0.25rem; font-weight: 600; }
.meta { margin: 0.1rem 0; font-size: 0.85rem; color: #555; }
.meta.due { color: #8a5300; font-weight: 600; }
.meta.muted { color: #999; }
.fee { margin: 0.25rem 0 0; font-size: 0.85rem; }
.actions { display: flex; gap: 0.4rem; align-items: center; margin-top: 0.5rem; flex-wrap: wrap; }
.btn { padding: 0.45rem 0.9rem; border: 0; border-radius: 6px; background: var(--brand); color: #fff; cursor: pointer; }
.link-btn { background: none; border: 0; color: var(--brand); cursor: pointer; padding: 0; font-size: 0.85rem; }
.lose-form { margin-top: 1rem; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.lose-form h3 { margin: 0; font-size: 0.95rem; width: 100%; }
</style>
