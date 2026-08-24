<template>
  <div class="check-in">
    <PageHeader :title="t('checkin.title')">
      <template #actions>
        <div>
        <p class="sub">{{ t('checkin.subtitle') }}</p>
        </div>
        <!-- The one thing staff need to glance at. Not a spinner: the app works
        the same either way, and the badge is how they find out it is
        catching up rather than by the buttons behaving differently. -->
        <div class="status" role="status">
        <span class="pill" :class="online ? 'pill-online' : 'pill-offline'">
        {{ online ? t('checkin.online') : t('checkin.offline') }}
        </span>
        <span v-if="pending.length" class="pill pill-pending">
        {{ t('checkin.waitingToSync', { n: pending.length }) }}
        </span>
        <span v-if="syncing" class="pill">{{ t('checkin.syncing') }}</span>
        </div>
      </template>
    </PageHeader>

    <section v-if="summary" class="counts" :aria-label="t('checkin.counts')">
      <div class="count">
        <span class="count-value">{{ summary.arrivedPeople }}</span>
        <span class="count-label">{{ t('checkin.arrived') }}</span>
      </div>
      <div class="count">
        <span class="count-value">{{ summary.expectedPeople }}</span>
        <span class="count-label">{{ t('checkin.expected') }}</span>
      </div>
      <div class="count">
        <span class="count-value">{{ summary.arrivedGuests }}/{{ summary.totalGuests }}</span>
        <span class="count-label">{{ t('checkin.parties') }}</span>
      </div>
    </section>

    <!-- Refused by the server and waiting for a person. Above everything else
         because it is the only thing here that needs a decision. -->
    <section v-if="failures.length" class="failures" :aria-label="t('checkin.needsAttention')">
      <h2>{{ t('checkin.needsAttention') }}</h2>
      <ul>
        <li v-for="failure in failures" :key="failure.clientActionId">
          <span class="failure-name">{{ failure.guestName || failure.guestId }}</span>
          <span class="failure-reason">{{ failure.failedReason }}</span>
          <button class="link-btn" @click="discardFailure(failure.clientActionId)">
            {{ t('checkin.discard') }}
          </button>
        </li>
      </ul>
    </section>

    <div class="panes">
      <!-- Scanning. Needs signal, and says so rather than pretending. -->
      <section class="pane" :aria-label="t('checkin.scan')">
        <h2>{{ t('checkin.scan') }}</h2>

        <form class="scan-form" @submit.prevent="submitScan">
          <label class="visually-hidden" for="scan-token">{{ t('checkin.scanHint') }}</label>
          <input
            id="scan-token"
            ref="scanInput"
            v-model="scanToken"
            class="scan-input"
            type="text"
            autocomplete="off"
            :placeholder="t('checkin.scanHint')"
          />
          <button class="btn" type="submit" :disabled="!scanToken.trim()">
            {{ t('checkin.check') }}
          </button>
        </form>

        <p v-if="scanMessage" class="scan-message" :class="scanOk ? 'ok' : 'bad'" role="alert">
          {{ scanMessage }}
        </p>

        <!-- A scan answers "who is this". Arriving is a second, deliberate
             act, so a code pointed at a camera by accident changes nothing. -->
        <div v-if="scannedGuests.length" class="scanned">
          <div v-for="guest in scannedGuests" :key="guest.guestId" class="scanned-row">
            <label class="scanned-name">
              <input
                v-model="arriving"
                type="checkbox"
                :value="guest.guestId"
                :disabled="guest.alreadyArrived >= guest.partySize"
              />
              {{ guest.name }}
            </label>
            <span class="scanned-meta">
              {{ t('checkin.ofParty', { n: guest.partySize }) }}
              <template v-if="guest.alreadyArrived">
                · {{ t('checkin.alreadyIn', { n: guest.alreadyArrived }) }}
              </template>
              <template v-if="guest.tableNumber"> · {{ guest.tableNumber }}</template>
            </span>
          </div>

          <button class="btn" :disabled="!arriving.length" @click="confirmArrivals">
            {{ t('checkin.markArrived', { n: arriving.length }) }}
          </button>
        </div>
      </section>

      <!-- The list. What staff fall back to when a phone will not wake up,
           and the only thing that works with no signal at all. -->
      <section class="pane" :aria-label="t('checkin.byName')">
        <header class="pane-head">
          <h2>{{ t('checkin.byName') }}</h2>
          <input
            v-model="search"
            class="search"
            type="search"
            :placeholder="t('checkin.searchGuests')"
            :aria-label="t('checkin.searchGuests')"
          />
        </header>

        <p v-if="hiddenBySearch" class="hidden-note">
          {{ t('checkin.hiddenBySearch', { n: hiddenBySearch }) }}
        </p>

        <ul class="roster">
          <li v-for="guest in visibleRoster" :key="guest.id" :data-guest-id="guest.id">
            <span class="roster-name">{{ guest.name }}</span>
            <span v-if="guest.partySize > 1" class="roster-party">×{{ guest.partySize }}</span>
            <span v-if="queuedGuestIds.has(guest.id)" class="roster-queued">
              {{ t('checkin.queued') }}
            </span>
            <button class="link-btn" @click="arriveByName(guest)">
              {{ t('checkin.arrive') }}
            </button>
          </li>
        </ul>

        <EmptyState v-if="!roster.length" tone="no-results" :title="t('checkin.noRoster')" />
      </section>
    </div>

    <!-- Issuing codes lives here rather than on the guest list because this is
         the screen somebody opens when a guest turns up without one. -->
    <CredentialPanel v-if="eventId" :event-id="eventId" :guests="roster" />
  </div>
</template>

<script setup>
import EmptyState from '@/components/ui/EmptyState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useCheckIn from '@/composables/useCheckIn'
import CredentialPanel from '@/components/dashboard/checkin/CredentialPanel.vue'
import { guestsService } from '@/services/guests.service'
import { useAuthUser } from '@/composables/useAuthUser'

const { t } = useI18n()

const { eventId: currentEventId } = useAuthUser()
const eventId = currentEventId.value

const {
  roster, visibleRoster, hiddenBySearch, search, setRoster,
  pending, failures, queuedGuestIds, summary,
  online, syncing, lastScan,
  load, scan, arrive, discardFailure,
} = useCheckIn(eventId)

const scanToken = ref('')
const scanInput = ref(null)
const arriving = ref([])

const scannedGuests = computed(() => lastScan.value?.guests || [])

const scanOk = computed(() => lastScan.value?.outcome === 'VALID')

/** Each refusal gets its own sentence. "Invalid code" tells the person
 *  standing at the door nothing they can act on. */
const scanMessage = computed(() => {
  const outcome = lastScan.value?.outcome
  if (!outcome || outcome === 'VALID') return ''
  return t(`checkin.outcome.${outcome}`, t('checkin.outcome.NOT_GENUINE'))
})

onMounted(async () => {
  await load()
  await loadRoster()
  scanInput.value?.focus()
})

/**
 * Loads the guest list once and caches it on the device.
 *
 * <p>A failure here is survivable — `load()` has already put the cached copy
 * on screen, which at a door with no signal is the only copy there is.
 */
async function loadRoster() {
  try {
    const response = await guestsService.list(eventId)
    const list = response?.data ?? response ?? []
    await setRoster(list.map(g => ({
      id: g.id,
      name: g.name,
      partySize: (g.adultCount ?? 0) + (g.childCount ?? 0) || g.numOfGuests || 1,
      tableNumber: g.tableNumber,
      householdName: g.householdName,
    })))
  } catch {
    // Cached roster stands.
  }
}

async function submitScan() {
  arriving.value = []
  const result = await scan(scanToken.value.trim())
  scanToken.value = ''
  scanInput.value?.focus()

  // Pre-tick everybody who has not already arrived: a family walking in
  // together is the common case, and unticking two is less work than
  // ticking four.
  if (result?.outcome === 'VALID') {
    arriving.value = result.guests
      .filter(g => g.alreadyArrived < g.partySize)
      .map(g => g.guestId)
  }
}

async function confirmArrivals() {
  const picked = scannedGuests.value.filter(g => arriving.value.includes(g.guestId))
  await arrive(picked.map(g => ({
    guestId: g.guestId,
    // What is left of their party, not the whole of it — a guest down for
    // four who already sent two in arrives with two.
    arrivedCount: Math.max(1, g.partySize - g.alreadyArrived),
    credentialId: lastScan.value?.credentialId ?? null,
    guestName: g.name,
  })))

  lastScan.value = null
  arriving.value = []
}

async function arriveByName(guest) {
  await arrive([{
    guestId: guest.id,
    arrivedCount: guest.partySize || 1,
    credentialId: null,
    guestName: guest.name,
  }])
}
</script>

<style scoped>
.check-in { display: flex; flex-direction: column; gap: 16px; padding: 4px; }

.page-head h1 { margin: 0; font-size: 22px; }
.sub { margin: 4px 0 0; font-size: 13px; color: #6b6b6b; }

.status { display: flex; gap: 6px; flex-wrap: wrap; }
.pill { padding: 4px 10px; border-radius: 999px; font-size: 12px; background: #f0efe9; }
.pill-online { background: #e6f2e2; color: #2f6b28; }
.pill-offline { background: #fdeceb; color: #a3271f; }
.pill-pending { background: #fbf1dc; color: #8f6d1f; }

.counts { display: flex; gap: 12px; flex-wrap: wrap; }
.count { flex: 1 1 120px; padding: 12px 14px; border-radius: 10px; background: #faf8f4; }
.count-value { display: block; font-size: 26px; font-weight: 600; }
.count-label { font-size: 12px; color: #6b6b6b; }

.failures { padding: 12px 14px; border-radius: 10px; background: #fdeceb; }
.failures h2 { margin: 0 0 8px; font-size: 14px; color: #a3271f; }
.failures ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.failures li { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; font-size: 13px; }
.failure-name { font-weight: 600; }
.failure-reason { color: #a3271f; }

.panes { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 860px) { .panes { grid-template-columns: 1fr; } }

.pane { padding: 14px; border-radius: 10px; background: #fff; border: 1px solid #ece8e0; }
.pane h2 { margin: 0 0 10px; font-size: 15px; }
.pane-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }

.scan-form { display: flex; gap: 8px; }
.scan-input { flex: 1; padding: 10px 12px; border: 1px solid #ddd8cf; border-radius: 8px; font-size: 15px; }
.search { padding: 7px 10px; border: 1px solid #ddd8cf; border-radius: 8px; font-size: 13px; }

.scan-message { margin: 10px 0 0; font-size: 13px; }
.scan-message.ok { color: #2f6b28; }
.scan-message.bad { color: #a3271f; }

.scanned { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.scanned-row { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; flex-wrap: wrap; }
.scanned-name { display: flex; gap: 8px; align-items: center; font-size: 15px; }
.scanned-meta { font-size: 12px; color: #6b6b6b; }

.roster { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 4px; max-height: 420px; overflow-y: auto; }
.roster li { display: flex; gap: 8px; align-items: baseline; padding: 6px 8px; border-radius: 6px; }
.roster li:hover { background: #faf8f4; }
.roster-name { flex: 1; }
.roster-party { font-size: 12px; color: #6b6b6b; }
.roster-queued { font-size: 11px; color: #8f6d1f; }

.hidden-note, .empty { font-size: 12px; color: #6b6b6b; margin: 6px 0 0; }

.btn { padding: 9px 16px; border: 0; border-radius: 8px; background: var(--brand); color: #fff; font-size: 14px; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: default; }
.link-btn { border: 0; background: none; color: var(--brand); cursor: pointer; font-size: 13px; padding: 0; }

.visually-hidden {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}
</style>
