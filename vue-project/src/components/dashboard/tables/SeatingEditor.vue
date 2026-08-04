<template>
  <div class="seating-editor">
    <!-- Somebody else has the editor. Shown, not hidden: the plan is still
         worth looking at, and a name plus a countdown is an answer you can
         act on where "locked" is not. -->
    <div v-if="lock.readOnly" class="lock-banner" role="status">
      <strong>{{ lock.holderName || t('seating.someone') }}</strong>
      {{ t('seating.isEditing') }}
      <span v-if="lock.secondsRemaining">· {{ lock.secondsRemaining }}s</span>
      <button class="link-btn" @click="retryLock">{{ t('seating.retry') }}</button>
    </div>

    <p v-if="error" class="error-banner" role="alert">{{ errorMessage }}</p>

    <div class="editor-grid">
      <!-- Unassigned. Always present, so a plan cannot look finished while
           twelve people have nowhere to sit. -->
      <section class="pane unseated-pane" :aria-label="t('seating.unseated')">
        <header class="pane-head">
          <h3>{{ t('seating.unseated') }} <span class="badge">{{ unseated.length }}</span></h3>
          <input
            v-model="search"
            class="search"
            type="search"
            :placeholder="t('seating.searchGuests')"
            :aria-label="t('seating.searchGuests')"
          />
        </header>

        <p v-if="hiddenBySearch" class="hidden-note">
          {{ t('seating.hiddenBySearch', { n: hiddenBySearch }) }}
        </p>

        <draggable
          v-model="draggableUnseated"
          :group="{ name: 'guests' }"
          item-key="id"
          class="guest-list"
          :disabled="lock.readOnly"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <div
              class="guest"
              :class="{ selected: selectedGuestIds.includes(element.id) }"
              :data-guest-id="element.id"
              tabindex="0"
              role="button"
              :aria-pressed="selectedGuestIds.includes(element.id)"
              @click="toggleSelected(element.id)"
              @keydown.enter.prevent="toggleSelected(element.id)"
              @keydown.space.prevent="toggleSelected(element.id)"
            >
              <span class="guest-name">{{ element.name }}</span>
              <span v-if="partySize(element) > 1" class="party">×{{ partySize(element) }}</span>

              <!-- The household is a button, not a label: one click picks the
                   whole family. Each member is still selectable on their own,
                   so a family that wants to split can. -->
              <button
                v-if="element.householdName"
                class="household"
                type="button"
                :data-household-key="element.householdKey"
                :aria-label="t('seating.selectHousehold', { name: element.householdName })"
                @click.stop="selectHousehold(element.householdKey)"
                @keydown.enter.stop
              >
                {{ element.householdName }}
              </button>
            </div>
          </template>
        </draggable>

        <p v-if="!unseated.length" class="empty">{{ t('seating.allSeated') }}</p>
      </section>

      <!-- The room. -->
      <section class="pane tables-pane" :aria-label="t('seating.tables')">
        <header class="pane-head">
          <h3>{{ t('seating.tables') }} <span class="badge">{{ seatableTables.length }}</span></h3>

          <!-- The keyboard route to the same thing dragging does. Not a
               fallback: somebody working through two hundred guests with a
               keyboard is faster than with a mouse. -->
          <div v-if="selectedGuestIds.length" class="move-bar">
            <label class="move-label" for="move-target">
              {{ t('seating.moveSelected', { n: selectedGuestIds.length }) }}
            </label>
            <select id="move-target" v-model="moveTargetId" class="move-select">
              <option value="">{{ t('seating.chooseTable') }}</option>
              <option v-for="table in seatableTables" :key="table.id" :value="table.id">
                {{ table.title }} ({{ seatsTaken(table) }}/{{ table.maxGuest ?? '∞' }})
              </option>
            </select>
            <button class="btn" :disabled="!moveTargetId || lock.readOnly" @click="moveSelected">
              {{ t('seating.move') }}
            </button>
            <button class="link-btn" @click="clearSelection">{{ t('seating.clear') }}</button>

            <!-- Says which path the move will take. A whole household goes in
                 one call that the backend refuses to apply partially. -->
            <span v-if="wholeHouseholdKey" class="household-note">
              {{ t('seating.asHousehold') }}
            </span>
          </div>
        </header>

        <div class="tables">
          <article
            v-for="table in seatableTables"
            :key="table.id"
            class="table-card"
            :class="{ overfull: isOverfull(table) }"
          >
            <header class="table-head">
              <h4>{{ table.title }}</h4>
              <span class="seats" :class="{ warn: isOverfull(table) }">
                {{ seatsTaken(table) }}/{{ table.maxGuest ?? '∞' }}
              </span>
            </header>

            <p v-if="isOverfull(table)" class="overflow-note">
              {{ t('seating.overCapacity') }}
            </p>

            <draggable
              :list="table.guests"
              :group="{ name: 'guests' }"
              item-key="id"
              class="guest-list seated"
              :disabled="lock.readOnly"
              @add="event => onDropOnTable(event, table)"
            >
              <template #item="{ element }">
                <div class="guest seated-guest" :data-guest-id="element.id">
                  <span class="guest-name">{{ element.name }}</span>
                  <span v-if="partySize(element) > 1" class="party">×{{ partySize(element) }}</span>
                  <button
                    class="remove"
                    :disabled="lock.readOnly"
                    :aria-label="t('seating.unseatGuest', { name: element.name })"
                    @click="unseat(element.id)"
                  >×</button>
                </div>
              </template>
            </draggable>
          </article>
        </div>

        <!-- Stage, entrance, dance floor. Shown because a seating plan without
             them is a list, not a room. -->
        <div v-if="fixedElements.length" class="fixed-elements">
          <h4>{{ t('seating.fixedElements') }}</h4>
          <span v-for="element in fixedElements" :key="element.id" class="fixed-chip">
            {{ element.title }}
          </span>
        </div>
      </section>
    </div>

    <!-- Asked, never assumed. Squeezing a chair in is a real decision and the
         organizer is the one who can see the room. -->
    <div v-if="overflowPrompt" class="dialog-backdrop" @click.self="overflowPrompt = null">
      <div class="dialog" role="alertdialog" aria-modal="true">
        <p>{{ overflowPrompt.message }}</p>
        <div class="dialog-actions">
          <button class="link-btn" @click="overflowPrompt = null">{{ t('seating.cancel') }}</button>
          <button class="btn" @click="confirmOverflow">{{ t('seating.seatAnyway') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import draggable from 'vuedraggable'
import { useI18n } from 'vue-i18n'
import useSeatingEditor from '@/composables/useSeatingEditor'

const props = defineProps({
  eventId: { type: String, required: true },
})

const { t } = useI18n()

const {
  unseated, error,
  seatableTables, fixedElements, visibleUnseated, hiddenBySearch, search,
  selectedGuestIds, toggleSelected, clearSelection,
  lock, acquireLock,
  load, seatSelection, seatHousehold, unseat,
  seatsTaken, partySize, isOverfull,
} = useSeatingEditor(props.eventId)

const moveTargetId = ref('')
const overflowPrompt = ref(null)

/**
 * vuedraggable writes back to whatever it is bound to, and the filtered list is
 * computed. Binding it directly would either throw or silently drop the filter,
 * so the setter is a no-op — the real move happens in the drop handler.
 */
const draggableUnseated = computed({
  get: () => visibleUnseated.value,
  set: () => {},
})

onMounted(async () => {
  await load()
  await acquireLock()
})

async function retryLock() {
  await acquireLock()
  if (!lock.readOnly) await load()
}

/** A drop is a move of exactly the dragged guest. */
async function onDropOnTable(event, table) {
  const guestId = event.item?.dataset?.guestId
  if (!guestId) return

  selectedGuestIds.value = [guestId]
  await attemptSeat(table.id)
}

function onDragEnd() {
  // Dropping back on the unassigned pane is handled by the backend reload;
  // nothing to do here beyond letting the list settle.
}

async function moveSelected() {
  await attemptSeat(moveTargetId.value)
}

/**
 * Tries the move, and asks rather than assumes when the table is full.
 *
 * <p>The backend decides whether it fits — this only turns its refusal into a
 * question. Re-implementing the capacity rule here would give two answers to
 * one question.
 */
/** Everyone currently selected, resolved back to their guest records. */
const selectedGuests = computed(() =>
  unseated.value.filter(g => selectedGuestIds.value.includes(g.id)))

/**
 * The household key when the selection is one household, whole.
 *
 * <p>Whole matters: moving three of four members through the household call
 * would seat the fourth as well, which is not what was asked. Anything short of
 * the full family goes guest by guest.
 */
const wholeHouseholdKey = computed(() => {
  const picked = selectedGuests.value
  if (!picked.length) return null

  const key = picked[0].householdKey
  if (!key || picked.some(g => g.householdKey !== key)) return null

  const members = unseated.value.filter(g => g.householdKey === key)
  return members.length === picked.length ? key : null
})

/** Picks every unseated member of one household. */
function selectHousehold(key) {
  if (!key) return
  clearSelection()
  unseated.value
    .filter(g => g.householdKey === key)
    .forEach(g => toggleSelected(g.id))
}

async function attemptSeat(tableId) {
  const before = [...selectedGuestIds.value]
  const householdKey = wholeHouseholdKey.value

  const { failure } = householdKey
    ? await seatHousehold(householdKey, tableId)
    : await seatSelection(tableId)

  if (failure && isOverflowRefusal(failure)) {
    overflowPrompt.value = {
      tableId, guestIds: before, householdKey,
      message: failure.detail || failure.message || '',
    }
    error.value = null
  } else {
    moveTargetId.value = ''
  }
}

/**
 * Repeats the refused move with the organizer's consent.
 *
 * <p>Down the same path it took the first time — confirming a household's
 * overflow guest by guest would seat the family one at a time and leave the
 * last member wherever the table ran out.
 */
async function confirmOverflow() {
  const { tableId, guestIds, householdKey } = overflowPrompt.value
  overflowPrompt.value = null
  selectedGuestIds.value = guestIds

  if (householdKey) await seatHousehold(householdKey, tableId, { allowOverflow: true })
  else await seatSelection(tableId, { allowOverflow: true })

  moveTargetId.value = ''
}

/** A capacity refusal names the seats; a conflict or a lock does not. */
function isOverflowRefusal(e) {
  const message = e?.detail || e?.message || ''
  return message.includes('места') && !message.includes('сменет од друг')
}

const errorMessage = computed(() =>
  error.value?.detail || error.value?.message || '')
</script>

<style scoped>
.seating-editor { display: flex; flex-direction: column; gap: 14px; }

.lock-banner {
  padding: 10px 14px; border-radius: 8px; font-size: 13.5px;
  background: #fff4e5; border: 1px solid #ffd8a8; color: #8a5a00;
}
.error-banner {
  margin: 0; padding: 10px 14px; border-radius: 8px; font-size: 13.5px;
  background: #fdecea; border: 1px solid #f5c2c0; color: #a3231b;
}

.editor-grid { display: grid; grid-template-columns: 280px 1fr; gap: 16px; align-items: start; }
@media (max-width: 900px) { .editor-grid { grid-template-columns: 1fr; } }

.pane { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; }
.pane-head { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.pane-head h3 { margin: 0; font-size: 14px; display: flex; align-items: center; gap: 8px; }
.badge {
  background: #f3f4f6; border-radius: 10px; padding: 1px 8px;
  font-size: 11.5px; font-weight: 600; color: #6b7280;
}

.search {
  width: 100%; height: 34px; padding: 0 10px; font-size: 13px;
  border: 1px solid #e5e7eb; border-radius: 8px;
}
.hidden-note { margin: 0 0 8px; font-size: 11.5px; color: #6b7280; }

.guest-list { display: flex; flex-direction: column; gap: 6px; min-height: 40px; }
.guest {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 8px;
  background: #fafafa; font-size: 13px; cursor: grab;
}
.guest:focus-visible { outline: 2px solid #5a7a52; outline-offset: 1px; }
.guest.selected { background: #eef2ec; border-color: #5a7a52; }
.guest-name { flex: 1; }
.party { font-size: 11px; font-weight: 700; color: #6b7280; }
/* A button, but it reads as the label it replaced. */
.household {
  font-size: 10.5px; color: #b8954e;
  background: none; border: 0; padding: 0 2px; cursor: pointer;
  border-bottom: 1px dashed rgba(184, 149, 78, 0.5);
}
.household:hover, .household:focus-visible { color: #8f7134; }

.household-note { font-size: 11.5px; color: #b8954e; }

.remove {
  border: none; background: transparent; color: #9ca3af;
  font-size: 16px; line-height: 1; cursor: pointer; padding: 0 2px;
}
.remove:hover { color: #c9372c; }

.move-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.move-label { font-size: 12.5px; color: #374151; }
.move-select { height: 32px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 8px; font-size: 13px; }

.btn {
  height: 32px; padding: 0 14px; border: none; border-radius: 8px;
  background: #5a7a52; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn:disabled { opacity: .5; cursor: not-allowed; }
.link-btn {
  border: none; background: transparent; color: #6b7280;
  font-size: 12.5px; text-decoration: underline; cursor: pointer;
}

.tables { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.table-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
.table-card.overfull { border-color: #f5c2c0; }
.table-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
.table-head h4 { margin: 0; font-size: 13.5px; }
.seats { font-size: 11.5px; font-weight: 700; color: #6b7280; font-variant-numeric: tabular-nums; }
.seats.warn { color: #c9372c; }
.overflow-note { margin: 0 0 8px; font-size: 11.5px; color: #c9372c; }

.fixed-elements { margin-top: 14px; padding-top: 12px; border-top: 1px solid #e5e7eb; }
.fixed-elements h4 { margin: 0 0 8px; font-size: 12px; color: #6b7280; }
.fixed-chip {
  display: inline-block; margin: 0 6px 6px 0; padding: 3px 10px;
  background: #f3f4f6; border-radius: 12px; font-size: 11.5px; color: #374151;
}

.empty { font-size: 12.5px; color: #6b7280; text-align: center; padding: 12px 0; }

.dialog-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.dialog {
  background: #fff; border-radius: 12px; padding: 20px; max-width: 420px;
  box-shadow: 0 10px 40px rgba(0,0,0,.2);
}
.dialog p { margin: 0 0 16px; font-size: 13.5px; line-height: 1.5; }
.dialog-actions { display: flex; gap: 10px; justify-content: flex-end; align-items: center; }
</style>
