<template>
  <div>
    <PageHead :title="t('agencyTasks.title')" :subtitle="t('agencyTasks.subtitle')" />

    <div class="toolbar">
      <div class="filters-row" role="group" :aria-label="t('agencyTasks.filterLabel')">
        <button
          v-for="option in eventFilters"
          :key="option.value"
          type="button"
          :aria-pressed="eventFilter === option.value"
          @click="eventFilter = option.value"
        >{{ option.label }}</button>
      </div>
      <span class="muted small">{{ t('agencyTasks.count', { n: shown.length }) }}</span>
    </div>

    <p v-if="loading" class="empty">{{ t('common.loading') }}</p>

    <p v-else-if="error" class="empty" role="alert">{{ error }}</p>

    <!-- Three columns, as the design has it. Not drag-and-drop: moving a task
         between events is not a thing, and within one status the order carries
         no meaning, so a board that could be rearranged would be promising
         something the model does not have. -->
    <div v-else class="kanban">
      <section v-for="column in columns" :key="column.status" class="kcol">
        <header>
          {{ t(`agencyTasks.status.${column.status}`) }}
          <span>{{ column.items.length }}</span>
        </header>

        <article v-for="task in column.items" :key="task.id" class="kcard">
          <b>{{ task.title }}</b>
          <div class="meta">
            <span v-if="task.eventName" class="chip">{{ task.eventName }}</span>
            <span v-if="task.dueDate" :class="{ overdue: isOverdue(task) }">{{ day(task.dueDate) }}</span>
          </div>
          <span v-if="task.assignee" class="assignee">{{ assigneeLabel(task.assignee) }}</span>
        </article>

        <p v-if="!column.items.length" class="kcol-empty">{{ t('agencyTasks.none') }}</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import { tasksService } from '@/services/tasks.service'
import { getErrorMessage } from '@/services/apiError'

/*
  Every open task across the agency's events, on one board.

  Reads `/tasks/workspace`, which is scoped by the caller's accessible events
  exactly as `/analytics/workspace` is — the per-event `/tasks` endpoint takes a
  required `eventId`, so there was no way to ask this question at all.
*/

/* The three columns the board shows. CANCELED is a fourth TaskStatus and is
   deliberately not one of them: a cancelled task is not work, and a column of
   them would be the widest thing on an agency board within a season. */
const STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE']
const ALL = 'ALL'

const { t, locale } = useI18n()

const tasks = ref([])
const eventFilter = ref(ALL)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const response = await tasksService.workspace()
    tasks.value = response?.data ?? response ?? []
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
})

/** Only the events that actually have a task on the board. */
const eventFilters = computed(() => {
  const seen = new Map()
  for (const task of tasks.value) {
    if (task.eventId && !seen.has(task.eventId)) seen.set(task.eventId, task.eventName || task.eventId)
  }
  return [
    { value: ALL, label: t('agencyTasks.allEvents') },
    ...[...seen].map(([value, label]) => ({ value, label })),
  ]
})

const shown = computed(() =>
  eventFilter.value === ALL ? tasks.value : tasks.value.filter((task) => task.eventId === eventFilter.value),
)

const columns = computed(() =>
  STATUSES.map((status) => ({
    status,
    items: shown.value.filter((task) => (task.status || 'PENDING') === status),
  })),
)

const day = (iso) => new Date(iso).toLocaleDateString(locale.value, { day: 'numeric', month: 'short' })

/** The assignee is a role, not a person: BRIDE, GROOM, PLANNER and so on. An
 *  unknown one prints its own name rather than a missing key. */
function assigneeLabel(value) {
  const key = `tasks.assignee.${value}`
  const label = t(key)
  return label === key ? value : label
}

/** A done task is never late, however far past its date it is. */
function isOverdue(task) {
  return task.status !== 'DONE' && new Date(task.dueDate) < new Date()
}
</script>

<style scoped>
/* `.kanban`, `.kcol`, `.kcard`, `.chip` and `.toolbar` are the design's, in
   `ivy/dash.css`. Local: the empty column and the late-date colour. */
.filters-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filters-row button {
  padding: 7px 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--card);
  font-size: 14px;
  color: var(--ink-2);
}

.filters-row button[aria-pressed='true'] {
  border-color: var(--ivy);
  background: var(--ivy);
  color: var(--on-ivy);
}

.kcard .meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--ink-3);
}

.kcard .overdue {
  color: var(--error);
  font-weight: 600;
}

.kcard .assignee {
  display: block;
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--ink-3);
}

.kcol-empty {
  padding: 18px 6px;
  text-align: center;
  font-size: 13.5px;
  color: var(--ink-3);
}
</style>
