<template>
  <div class="pipeline-page">
    <PageHead :title="t('agencyScreens.clients.title')" :subtitle="t('agencyScreens.clients.subtitle')">
      <template #actions>
        <button type="button" class="btn btn-primary btn-sm" @click="composing = !composing">
          + {{ t('agencyScreens.clients.newInquiry') }}
        </button>
      </template>
    </PageHead>

    <div class="kpis">
      <div class="kpi">
        <span>{{ t('agencyScreens.clients.kpiAll') }}</span>
        <strong>{{ openCount }}</strong>
        <small>{{ t('agencyScreens.clients.kpiAllNote') }}</small>
      </div>
      <div class="kpi">
        <span>{{ t('agencyScreens.clients.kpiNew') }}</span>
        <strong>{{ byStage.INQUIRY.length }}</strong>
        <small>{{ t('agencyScreens.clients.kpiNewNote') }}</small>
      </div>
      <div :class="['kpi', { caution: byStage.PROPOSAL.length > 0 }]">
        <span>{{ t('agencyScreens.clients.kpiProposals') }}</span>
        <strong>{{ byStage.PROPOSAL.length }}</strong>
        <small>{{ t('agencyScreens.clients.kpiProposalsNote') }}</small>
      </div>
      <div class="kpi">
        <span>{{ t('agencyScreens.clients.kpiWon') }}</span>
        <strong>{{ byStage.WON.length }}</strong>
        <small>{{ t('agencyScreens.clients.kpiWonNote') }}</small>
      </div>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <form v-if="composing" class="composer card" @submit.prevent="addLead">
      <input v-model="draft.name" type="text" :placeholder="t('crm.name')" maxlength="160" required />
      <input v-model="draft.contactEmail" type="email" :placeholder="t('crm.email')" />
      <input v-model="draft.source" type="text" :placeholder="t('crm.source')" maxlength="80" />
      <input v-model="draft.nextAction" type="text" :placeholder="t('crm.nextAction')" maxlength="200" />
      <input v-model="draft.nextActionAt" type="date" :aria-label="t('crm.nextActionAt')" />
      <button class="btn btn-primary btn-sm" type="submit" :disabled="!draft.name.trim()">{{ t('crm.add') }}</button>
    </form>

    <div class="section-line">
      <div>
        <h2>{{ t('agencyScreens.clients.pipeline') }}</h2>
        <p>{{ t('agencyScreens.clients.pipelineHint') }}</p>
      </div>
    </div>

    <section class="card board-card">
      <div class="board">
        <section v-for="stage in LEAD_STAGES" :key="stage" class="lane">
          <h3>
            {{ t(`crm.stage${stage}`) }}
            <span class="pill slate">{{ byStage[stage].length }}</span>
          </h3>

          <article v-for="lead in byStage[stage]" :key="lead.id" class="lead-card">
            <b class="lead-name">{{ lead.name }}</b>
            <small v-if="lead.source">{{ lead.source }}</small>
            <small v-if="lead.nextAction" :class="{ due: isDue(lead) }">
              {{ lead.nextAction }}<span v-if="lead.nextActionAt"> · {{ lead.nextActionAt }}</span>
            </small>
            <small v-else-if="isOpen(lead)" class="quiet">{{ t('crm.noAction') }}</small>

            <!--
              The fee and the budget are shown as two lines and never summed. An
              agency that adds them believes it is five times its size.
            -->
            <small v-if="lead.expectedValue" class="fee">{{ t('crm.fee') }}: {{ money(lead.expectedValue) }}</small>

            <small v-if="lead.lostReason" class="quiet">
              {{ t(`crm.lost${lead.lostReason}`) }}<span v-if="lead.lostNote"> — {{ lead.lostNote }}</span>
            </small>

            <div v-if="isOpen(lead)" class="lead-actions">
              <select
                :value="lead.stage"
                :disabled="busyLeadId === lead.id"
                :aria-label="t('crm.moveTo')"
                @change="onMove(lead, $event.target.value)"
              >
                <option v-for="option in MOVABLE" :key="option" :value="option">{{ t(`crm.stage${option}`) }}</option>
              </select>
              <button class="link-btn" :disabled="busyLeadId === lead.id" @click="onWin(lead)">{{ t('crm.win') }}</button>
              <button class="link-btn" :disabled="busyLeadId === lead.id" @click="startLosing(lead)">{{ t('crm.lose') }}</button>
            </div>

            <router-link v-else-if="lead.convertedEventId" class="link-btn"
                         :to="`/dashboard/overview?eventId=${lead.convertedEventId}`">
              {{ t('crm.openEvent') }} →
            </router-link>
          </article>

          <p v-if="!byStage[stage].length" class="lane-empty">{{ t('crm.emptyColumn') }}</p>
        </section>
      </div>
    </section>

    <!-- A loss with no reason teaches nobody anything, so the reason is asked
         for rather than assumed. -->
    <form v-if="losing" class="lose-form card" @submit.prevent="confirmLoss">
      <h3>{{ t('crm.loseHeading', { name: losing.name }) }}</h3>
      <select v-model="lossReason" :aria-label="t('crm.lostReason')">
        <option v-for="reason in LOST_REASONS" :key="reason" :value="reason">{{ t(`crm.lost${reason}`) }}</option>
      </select>
      <input v-model="lossNote" type="text" :placeholder="t('crm.lostNote')" maxlength="300" />
      <button class="btn btn-primary btn-sm" type="submit">{{ t('crm.confirmLoss') }}</button>
      <button class="link-btn" type="button" @click="losing = null">{{ t('common.cancel') }}</button>
    </form>

    <!--
      "What are we dropping?" — the leads whose next step is late, then the
      ones nobody has given a next step. Before, this sat above the board as
      two sentences; the design gives it a panel of its own.
    -->
    <div class="section-line">
      <div>
        <h2>{{ t('agencyScreens.clients.followUp') }}</h2>
        <p>{{ t('agencyScreens.clients.followUpHint') }}</p>
      </div>
    </div>
    <section class="card">
      <p v-if="overdue.length" class="summary warn">{{ t('crm.overdue', { count: overdue.length }) }}</p>
      <p v-if="missingNextAction.length" class="summary">{{ t('crm.noNextAction', { count: missingNextAction.length }) }}</p>
      <ul v-if="overdue.length || missingNextAction.length" class="lines">
        <li v-for="lead in overdue" :key="`o-${lead.id}`" class="line">
          <div>
            <b>{{ lead.name }}</b>
            <small>{{ lead.nextAction }} · {{ lead.nextActionAt }}</small>
          </div>
          <span class="pill red">{{ t('agencyScreens.clients.late') }}</span>
        </li>
        <li v-for="lead in missingNextAction" :key="`m-${lead.id}`" class="line">
          <div>
            <b>{{ lead.name }}</b>
            <small>{{ t(`crm.stage${lead.stage}`) }}</small>
          </div>
          <span class="pill amber">{{ t('crm.noAction') }}</span>
        </li>
      </ul>
      <p v-else class="lane-empty">{{ t('agencyScreens.clients.nothingDropped') }}</p>
    </section>
  </div>
</template>

<script setup>
/**
 * The agency's clients (2026 agency design, "Клиенти"): four counts, the
 * pipeline by stage, and the leads that are being dropped.
 *
 * <p>Presentation only changed. The stages, the win and lose actions and the
 * loss reasons are the pipeline's own, driven by {@link useLeadPipeline}.
 */
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useLeadPipeline, { LEAD_STAGES } from '@/composables/useLeadPipeline'
import { useAgencyPreferences } from '@/composables/useAgencyPreferences'
import { formatMoney } from '@/utils/agencyFormat.js'

/** WON and LOST are reached through their own actions — winning creates an
 *  event and losing asks for a reason, and neither is a dropdown change. */
const MOVABLE = ['INQUIRY', 'CONSULTATION', 'PROPOSAL']

const LOST_REASONS = ['PRICE', 'AVAILABILITY', 'COMPETITOR', 'CANCELLED', 'NO_RESPONSE', 'OTHER']

const { t, locale } = useI18n()

/** A lead's fee is drawn in the agency's own currency, from its settings. */
const { currency, load: loadPreferences } = useAgencyPreferences()
loadPreferences()
const {
  byStage, overdue, missingNextAction, error, busyLeadId,
  load, create, moveTo, win, lose,
} = useLeadPipeline()

const draft = reactive({
  name: '', contactEmail: '', source: '', nextAction: '', nextActionAt: '',
})

const losing = ref(null)
const composing = ref(false)

/** Everything still in play — won and lost leads are history, not pipeline. */
const openCount = computed(() => ['INQUIRY', 'CONSULTATION', 'PROPOSAL'].reduce((n, stage) => n + byStage.value[stage].length, 0))
const lossReason = ref('PRICE')
const lossNote = ref('')

onMounted(load)

const isOpen = (lead) => lead.stage !== 'WON' && lead.stage !== 'LOST'

function isDue(lead) {
  return isOpen(lead) && lead.nextActionAt
    && lead.nextActionAt <= new Date().toISOString().slice(0, 10)
}

function money(amount) {
  return formatMoney(amount, currency.value, locale.value)
}

async function addLead() {
  const created = await create({ ...draft, nextActionAt: draft.nextActionAt || null })
  if (created) {
    composing.value = false
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

<style scoped src="../../components/agency/agency-panels.css"></style>

<style scoped>
/* `.kpis`, `.kpi` and `.card` are the design's, in `ivy/dash.css`. */
.kpi.caution strong {
  color: var(--gold-deep);
}

.section-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin: 24px 0 12px;
}

.section-line h2 {
  margin: 0;
  font-size: 22px;
}

.section-line p {
  margin: 3px 0 0;
  color: var(--ink-3);
  font-size: 13px;
}

.composer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.composer input,
.lose-form input,
.lose-form select,
.lead-actions select {
  min-height: 36px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  font: inherit;
  font-size: 13.5px;
}

.board-card {
  padding: 0;
  overflow-x: auto;
}

.board {
  display: grid;
  grid-template-columns: repeat(5, minmax(220px, 1fr));
}

.lane {
  min-width: 0;
  padding: 16px;
  border-right: 1px solid var(--line);
}

.lane:last-child {
  border-right: 0;
}

.lane h3 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 12px;
  font-size: 16px;
}

.lead-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
}

.lead-card small {
  color: var(--ink-3);
  font-size: 12.5px;
}

.lead-card small.due {
  color: var(--gold-deep);
  font-weight: 600;
}

.lead-card small.quiet {
  color: var(--ink-4, var(--ink-3));
}

.lead-card .fee {
  color: var(--ink-2);
}

.lead-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}

.link-btn {
  padding: 0;
  border: 0;
  background: none;
  color: var(--ivy);
  font-size: 13px;
  font-weight: 700;
}

.lane-empty {
  margin: 0;
  color: var(--ink-3);
  font-size: 13px;
}

.lose-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.lose-form h3 {
  width: 100%;
  margin: 0;
  font-size: 16px;
}

.summary {
  margin: 0 0 6px;
  color: var(--ink-2);
  font-size: 13.5px;
}

.summary.warn {
  color: var(--gold-deep);
  font-weight: 600;
}

.error {
  color: var(--rose-ink);
}
</style>
