<template>
  <tr class="task-row" :class="{ 'row-done': task.status === 'DONE' }" @click="$emit('edit', task)">
    <td>
      <div class="task-cell">
        <input
          type="checkbox"
          class="task-checkbox"
          :checked="task.status === 'DONE'"
          @change="$emit('toggle-task', task.id)"
          @click.stop
        />
        <div class="task-info">
          <div class="task-name" :class="{ done: task.status === 'DONE' }">{{ task.title }}</div>
          <div v-if="task.description" class="task-desc">{{ task.description }}</div>
        </div>
      </div>
    </td>

    <td>
      <span class="type-badge" :class="task.type === 'REMINDER' ? 'type-reminder' : 'type-task'">
        {{ task.type === 'REMINDER' ? t('tables.tasks.reminder') : t('tables.tasks.task') }}
      </span>
    </td>

    <td>
      <select
        class="priority-select"
        :class="priorityClass"
        :value="task.priority || 'MEDIUM'"
        @change="$emit('change-priority', task.id, $event.target.value)"
        @click.stop
      >
        <option value="HIGH">{{ t('tables.tasks.priorityHigh') }}</option>
        <option value="MEDIUM">{{ t('tables.tasks.priorityMedium') }}</option>
        <option value="LOW">{{ t('tables.tasks.priorityLow') }}</option>
      </select>
    </td>

    <td class="due-cell">
      {{ task.dueDate ? formatDate(task.dueDate) : '—' }}
    </td>

    <td>
      <select
        class="status-select"
        :class="statusClass"
        :value="task.status"
        @change="$emit('change-status', task.id, $event.target.value)"
        @click.stop
      >
        <option value="PENDING">{{ t('tables.tasks.pending') }}</option>
        <option value="IN_PROGRESS">{{ t('tables.tasks.inProgress') }}</option>
        <option value="DONE">{{ t('tables.tasks.completed') }}</option>
      </select>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const props = defineProps({
  task: { type: Object, required: true }
});

defineEmits(['toggle-task', 'change-status', 'change-priority', 'edit']);

const statusClass = computed(() => {
  if (props.task.status === 'DONE') return 'pill-done';
  if (props.task.status === 'IN_PROGRESS') return 'pill-progress';
  return 'pill-pending';
});

const priorityClass = computed(() => {
  const p = props.task.priority || 'MEDIUM';
  if (p === 'HIGH') return 'pill-high';
  if (p === 'LOW') return 'pill-low';
  return 'pill-medium';
});

function formatDate(raw) {
  if (!raw) return '';
  try {
    return new Date(raw).toLocaleDateString(locale.value === 'mk' ? 'mk-MK' : 'en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  } catch {
    return raw;
  }
}
</script>

<style scoped>
.task-row { cursor: pointer; }
.row-done { opacity: 0.55; }

.task-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid var(--dash-sage-light);
  accent-color: var(--dash-sage);
  cursor: pointer;
  flex-shrink: 0;
}

.task-info { min-width: 0; }

.task-name {
  font-weight: 600;
  font-size: 13.5px;
  color: var(--dash-ink);
  word-break: break-word;
}

.task-name.done {
  text-decoration: line-through;
  color: var(--dash-light);
}

.task-desc {
  font-size: 12px;
  color: var(--dash-muted);
  margin-top: 2px;
  word-break: break-word;
}

/* Type badges */
.type-badge {
  display: inline-block;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.type-task {
  background: var(--dash-sage-ghost);
  color: var(--dash-sage);
}

.type-reminder {
  background: var(--dash-gold-pale);
  color: #8a6a30;
}

/* Priority & Status selects */
.priority-select,
.status-select {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  border: none;
  outline: none;
  cursor: pointer;
  appearance: auto;
  letter-spacing: 0.02em;
}

.pill-high {
  background: rgba(196, 150, 142, 0.15);
  color: #9a5e56;
}

.pill-medium {
  background: var(--dash-gold-pale);
  color: #8a6a30;
}

.pill-low {
  background: var(--dash-sky-pale);
  color: var(--dash-sky);
}

.pill-done {
  background: var(--dash-sage-ghost);
  color: var(--dash-sage);
}

.pill-progress {
  background: var(--dash-gold-pale);
  color: #8a6a30;
}

.pill-pending {
  background: var(--dash-cream);
  color: var(--dash-muted);
}

.due-cell {
  font-size: 12.5px;
  color: var(--dash-muted);
  white-space: nowrap;
}
</style>
