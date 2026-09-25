<template>
  <div class="task-board">
    <section
      v-for="column in columns"
      :key="column.status"
      class="lane"
      :class="{ 'lane--over': overColumn === column.status }"
      :data-status="column.status"
      :aria-label="t(`agencyTasks.status.${column.status}`)"
      @dragover.prevent="overColumn = column.status"
      @dragleave="onLeave(column.status, $event)"
      @drop.prevent="drop(column.status)"
    >
      <header class="lane-head">
        <h3>{{ t(`agencyTasks.status.${column.status}`) }}</h3>
        <span class="lane-count">{{ column.tasks.length }}</span>
      </header>

      <article
        v-for="task in column.tasks"
        :key="task.id"
        class="task-card"
        :class="{ 'task-card--late': task.overdue, 'task-card--dragging': dragging?.id === task.id }"
        draggable="true"
        tabindex="0"
        :data-task="task.id"
        :aria-label="t('agencyTasks.cardLabel', { title: task.title, assignee: assigneeName(task) })"
        @dragstart="onDragStart(task, $event)"
        @dragend="endDrag"
        @keydown.left.prevent="$emit('move', task, neighbour(column.status, -1))"
        @keydown.right.prevent="$emit('move', task, neighbour(column.status, 1))"
      >
        <b class="task-title">{{ task.title }}</b>
        <span class="task-event">{{ task.eventName }}</span>
        <div class="task-meta">
          <span v-if="task.dueAt" :class="['task-due', { late: task.overdue }]">
            <span v-if="task.overdue" class="late-dot" aria-hidden="true"></span>
            {{ formatDay(task.dueAt, locale, { withYear: false }) }}
          </span>
          <span v-else class="task-due">{{ t('agencyTasks.noDate') }}</span>
        </div>

        <div class="task-assignee">
          <span class="initials" :class="{ none: !task.assignee }" aria-hidden="true">{{ task.assignee ? initials(assigneeName(task)) || '?' : '—' }}</span>
          <select
            v-if="canAssign"
            :value="task.assignee?.id || ''"
            :aria-label="t('agencyTasks.assignLabel', { title: task.title })"
            @mousedown.stop
            @change="$emit('assign', task, $event.target.value || null)"
          >
            <option value="">{{ t('agencyTasks.unassignedName') }}</option>
            <option v-for="person in team" :key="person.id" :value="person.id">{{ person.name || '—' }}</option>
          </select>
          <span v-else class="assignee-name">{{ assigneeName(task) }}</span>
        </div>
      </article>

      <p v-if="!column.tasks.length" class="lane-empty">{{ t('agencyTasks.none') }}</p>
    </section>
  </div>
</template>

<script setup>
/**
 * The agency's tasks as three status columns, moved by dragging (2026 agency
 * design, "Задачи → Табла").
 *
 * <p>Across events, so a drag changes the status and nothing else: each event
 * keeps its own hand-made order, and an order that mixes weddings and
 * conferences would mean nothing. Cards are read by due date instead.
 *
 * <p>Every card says whose it is. An owner can hand it to somebody else from
 * the card; a member sees the name only — work is the owner's to distribute.
 * The arrow keys move a focused card one column, for anyone not using a mouse.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDay, initials } from '@/utils/agencyFormat.js'

const props = defineProps({
  tasks: { type: Array, required: true },
  /** `{ id, name }` people a task may be given to. */
  team: { type: Array, default: () => [] },
  canAssign: { type: Boolean, default: false },
})

const emit = defineEmits(['move', 'assign'])

const STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE']

const { t, locale } = useI18n()

const dragging = ref(null)
const overColumn = ref(null)

const columns = computed(() =>
  STATUSES.map((status) => ({ status, tasks: props.tasks.filter((task) => (task.status || 'PENDING') === status) })),
)

const assigneeName = (task) => task.assignee?.name || (task.assignee ? '—' : t('agencyTasks.unassignedName'))

function onDragStart(task, event) {
  dragging.value = task
  // Firefox starts no drag without data on the transfer.
  event.dataTransfer?.setData('text/plain', task.id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function endDrag() {
  dragging.value = null
  overColumn.value = null
}

/** Only when the pointer really leaves the lane, not when it crosses a card inside it. */
function onLeave(status, event) {
  if (event.currentTarget?.contains?.(event.relatedTarget)) return
  if (overColumn.value === status) overColumn.value = null
}

function drop(status) {
  const task = dragging.value
  endDrag()
  if (!task || (task.status || 'PENDING') === status) return
  emit('move', task, status)
}

/** The column to one side, or null at either end. */
function neighbour(status, step) {
  return STATUSES[STATUSES.indexOf(status) + step] ?? null
}
</script>

<style scoped>
.task-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(240px, 1fr));
  gap: 14px;
  padding: 16px 18px 18px;
}

.lane {
  min-height: 220px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--mist-2);
  transition: border-color 0.12s, background 0.12s;
}

.lane--over {
  border-color: var(--moss);
  background: var(--mist);
}

.lane-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.lane-head h3 {
  margin: 0;
  font-family: var(--ui);
  font-size: 14px;
  font-weight: 700;
}

.lane-count {
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--card);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 700;
}

.task-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
  padding: 11px 12px;
  border: 1px solid var(--line);
  border-left: 3px solid transparent;
  border-radius: 10px;
  background: var(--card);
  cursor: grab;
}

.task-card:focus-visible {
  outline: 3px solid var(--gold);
  outline-offset: 2px;
}

.task-card--late {
  border-left-color: var(--rose-ink);
}

.task-card--dragging {
  opacity: 0.45;
}

.task-title {
  font-size: 14px;
  font-weight: 600;
}

.task-event {
  color: var(--ink-3);
  font-size: 12.5px;
}

.task-meta {
  display: flex;
  gap: 8px;
  font-size: 12.5px;
  color: var(--ink-2);
}

.task-due.late {
  color: var(--rose-ink);
  font-weight: 700;
}

.late-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 4px;
  border-radius: 50%;
  background: var(--rose-ink);
}

.task-assignee {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.initials {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--mist);
  color: var(--ivy);
  font-size: 11px;
  font-weight: 700;
}

.initials.none {
  background: var(--mist-2);
  color: var(--ink-3);
}

.task-assignee select {
  flex: 1;
  min-width: 0;
  min-height: 30px;
  padding: 2px 6px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--card);
  color: var(--ink);
  font: inherit;
  font-size: 13px;
}

.assignee-name {
  font-size: 13px;
  color: var(--ink-2);
}

.lane-empty {
  margin: 8px 0 0;
  color: var(--ink-3);
  font-size: 13px;
}

@media (max-width: 900px) {
  .task-board {
    grid-template-columns: 1fr;
  }
}
</style>
