<template>
  <div class="board">
    <section
      v-for="column in columns"
      :key="column.status"
      class="col"
      :class="{ 'col--over': overColumn === column.status }"
      @dragover.prevent="onColumnOver(column.status)"
      @dragleave="onColumnLeave(column.status)"
      @drop.prevent="dropAt(column.status, column.tasks.length)"
    >
      <header class="col__head">
        <h3 class="col__title">{{ t(column.labelKey) }}</h3>
        <span class="col__count">{{ column.tasks.length }}</span>
      </header>

      <p v-if="!column.tasks.length" class="col__empty">{{ t('tables.tasks.board.empty') }}</p>

      <template v-for="(task, index) in column.tasks" :key="task.id">
        <div
          class="slot"
          :class="{ 'slot--active': isSlot(column.status, index) }"
          @dragover.prevent.stop="onSlotOver(column.status, index)"
          @drop.prevent.stop="dropAt(column.status, index)"
        ></div>

        <article
          class="card"
          :class="[`card--${priorityOf(task)}`, { 'card--dragging': dragging?.id === task.id }]"
          draggable="true"
          tabindex="0"
          @dragstart="start(task)"
          @dragend="end"
          @keydown="onKey(task, $event)"
        >
          <p class="card__title" @click="$emit('edit', task)">{{ task.title }}</p>

          <div class="card__meta">
            <span v-if="task.dueDate" class="card__due">{{ formatDate(task.dueDate) }}</span>
            <span class="card__priority">{{ t(priorityKey(task)) }}</span>
          </div>

          <label class="card__assign">
            <span class="sr-only">{{ t('tables.tasks.board.assignee') }}</span>
            <select
              :value="task.assigneeUserId || ''"
              :disabled="!assignees.length"
              @click.stop
              @change="$emit('assign', task.id, $event.target.value || null)"
            >
              <option value="">{{ t('tables.tasks.board.unassigned') }}</option>
              <option v-for="person in assignees" :key="person.id" :value="person.id">
                {{ person.name }}
              </option>
            </select>
          </label>
        </article>
      </template>

      <div
        class="slot slot--tail"
        :class="{ 'slot--active': isSlot(column.status, column.tasks.length) }"
        @dragover.prevent.stop="onSlotOver(column.status, column.tasks.length)"
        @drop.prevent.stop="dropAt(column.status, column.tasks.length)"
      ></div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Tasks as three columns, moved and ordered by dragging.
 *
 * <p>Two gestures, both meaning something the server stores. Across columns
 * changes the status. Up and down inside one changes the order, which is how
 * somebody says what to do first — three priority levels cannot express that,
 * which is why the task grew a position of its own.
 *
 * <p>The thin strips between cards are the drop targets. Working out an insert
 * point from the pointer's distance to each card's midpoint is the usual
 * approach and it guesses; a real target between two cards cannot.
 */

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  /** `{ id, name }` — the agency's own people. Empty disables the picker. */
  assignees: { type: Array, default: () => [] },
})

const emit = defineEmits(['reorder', 'move', 'assign', 'edit'])

const { t, locale } = useI18n()

const STATUSES = [
  { status: 'PENDING', labelKey: 'tables.tasks.pending' },
  { status: 'IN_PROGRESS', labelKey: 'tables.tasks.inProgress' },
  { status: 'DONE', labelKey: 'tables.tasks.completed' },
]

const dragging = ref(null)
const overColumn = ref(null)
const overIndex = ref(null)

const columns = computed(() =>
  STATUSES.map((column) => ({
    ...column,
    tasks: props.tasks
      .filter((task) => (task.status || 'PENDING') === column.status)
      // sortOrder is the stored answer; the fallbacks keep a list that
      // predates it from arriving in an arbitrary order.
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.id).localeCompare(String(b.id))),
  })),
)

function start(task) {
  dragging.value = task
}

function end() {
  dragging.value = null
  overColumn.value = null
  overIndex.value = null
}

function onColumnOver(status) {
  overColumn.value = status
}

function onColumnLeave(status) {
  // Only for the column being left. Dragging over a card inside it fires
  // dragleave on the column too, and clearing unconditionally makes the
  // highlight flicker under the cursor.
  if (overColumn.value === status) {
    overColumn.value = null
    overIndex.value = null
  }
}

function onSlotOver(status, index) {
  overColumn.value = status
  overIndex.value = index
}

function isSlot(status, index) {
  return dragging.value && overColumn.value === status && overIndex.value === index
}

/**
 * Applies the drop.
 *
 * <p>Always sends the whole column, because that is what changed: everything
 * below the insert point moved down by one.
 */
function dropAt(status, index) {
  const task = dragging.value
  const from = task ? task.status || 'PENDING' : null
  end()
  if (!task) return

  const target = columns.value.find((column) => column.status === status)
  if (!target) return

  const remaining = target.tasks.filter((candidate) => candidate.id !== task.id)
  const at = Math.max(0, Math.min(index, remaining.length))
  const orderedIds = [
    ...remaining.slice(0, at).map((candidate) => candidate.id),
    task.id,
    ...remaining.slice(at).map((candidate) => candidate.id),
  ]

  if (from === status) {
    const unchanged =
      orderedIds.length === target.tasks.length &&
      orderedIds.every((id, i) => id === target.tasks[i].id)
    // A card dropped back where it started is not a save.
    if (unchanged) return
    emit('reorder', status, orderedIds)
    return
  }

  emit('move', task.id, status, orderedIds)
}

/**
 * The same two moves from the keyboard.
 *
 * <p>Left and right change the column, up and down the position. Drag and drop
 * reaches one kind of user; this reaches the rest, and costs a dozen lines.
 */
function onKey(task, event) {
  const column = columns.value.find((c) => c.status === (task.status || 'PENDING'))
  const index = column.tasks.findIndex((candidate) => candidate.id === task.id)

  const sideways = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (sideways) {
    const at = STATUSES.findIndex((c) => c.status === column.status)
    const to = STATUSES[at + sideways]
    if (!to) return
    event.preventDefault()
    const target = columns.value.find((c) => c.status === to.status)
    emit('move', task.id, to.status, [...target.tasks.map((c) => c.id), task.id])
    return
  }

  const vertical = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
  if (!vertical) return

  const to = index + vertical
  if (to < 0 || to >= column.tasks.length) return
  event.preventDefault()

  const ids = column.tasks.map((candidate) => candidate.id)
  ids.splice(index, 1)
  ids.splice(to, 0, task.id)
  emit('reorder', column.status, ids)
}

function priorityOf(task) {
  return (task.priority || 'MEDIUM').toLowerCase()
}

/* priorityHigh / priorityMedium / priorityLow already exist; a second set
   keyed differently would be two names for one label. */
function priorityKey(task) {
  const priority = priorityOf(task)
  return `tables.tasks.priority${priority.charAt(0).toUpperCase()}${priority.slice(1)}`
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'mk-MK', {
    day: 'numeric',
    month: 'short',
  })
}
</script>

<style scoped>
.board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  align-items: start;
}

.col {
  background: var(--surface-2, #f3f5f2);
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 12px;
  min-height: 170px;
  transition: background .12s ease, border-color .12s ease;
}
.col--over { background: var(--surface-3, #e6eee7); border-color: var(--brand, #1f3d2b); }

.col__head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.col__title { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
.col__count { font-size: 13px; color: var(--ink-2, #6b7670); }
.col__empty { margin: 6px 0; font-size: 13px; color: var(--ink-3, #8a938d); }

/* The gap between two cards, and the real drop target. Invisible until
   something is dragged over it. */
.slot { height: 6px; border-radius: 3px; transition: background .1s ease; }
.slot--tail { height: 18px; }
.slot--active { background: var(--brand, #1f3d2b); }

.card {
  background: var(--surface, #fff);
  border: 1px solid var(--line, #dce3dc);
  border-left: 3px solid var(--line, #dce3dc);
  border-radius: 10px;
  padding: 10px 12px;
  cursor: grab;
}
.card:focus-visible { outline: 2px solid var(--brand, #1f3d2b); outline-offset: 2px; }
.card--dragging { opacity: .45; cursor: grabbing; }

.card--high { border-left-color: #b4544a; }
.card--medium { border-left-color: #c9a24d; }
.card--low { border-left-color: #7f9b86; }

.card__title { margin: 0; font-size: 14px; cursor: pointer; }
.card__meta { display: flex; gap: 10px; margin-top: 5px; font-size: 12px; color: var(--ink-2, #6b7670); }
.card__priority { color: var(--ink-3, #8a938d); }

.card__assign { display: block; margin-top: 8px; }
.card__assign select {
  width: 100%;
  padding: 5px 7px;
  font-size: 12px;
  border: 1px solid var(--line, #dce3dc);
  border-radius: 7px;
  background: var(--surface, #fff);
  color: inherit;
}

.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

@media (max-width: 760px) {
  .board { grid-template-columns: 1fr; }
}
</style>
