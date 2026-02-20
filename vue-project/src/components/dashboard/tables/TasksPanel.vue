<template>
  <div class="tasks-card">
    <div class="task-list">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-item clickable"
        :class="[
          { 'task-completed': task.status === 'DONE' },
          task.priority ? `border-${task.priority.toLowerCase()}` : ''
        ]"
        @click="$emit('edit', task)"
      >
        <input
          type="checkbox"
          class="task-checkbox"
          :checked="task.status === 'DONE'"
          @change="$emit('toggle-task', task.id)"
          @click.stop
        />
        <div class="task-body">
          <div class="task-name" :class="{ done: task.status === 'DONE' }">
            {{ task.title }}
          </div>
          <div v-if="task.description" class="task-desc">{{ task.description }}</div>
          <div class="task-meta">
            <span v-if="task.dueDate" class="task-due">
              {{ t('tables.tasks.due') }}: {{ formatDate(task.dueDate) }}
            </span>
            <span v-if="task.type" class="task-type-badge" :class="typeBadgeClass(task.type)">
              {{ task.type === 'REMINDER' ? t('tables.tasks.reminder') : t('tables.tasks.task') }}
            </span>
            <span v-if="task.priority" class="task-priority-badge" :class="priorityClass(task.priority)">
              {{ t(`tables.tasks.priority${task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}`) }}
            </span>
          </div>
        </div>

        <div class="task-selects">
          <select
            class="priority-select"
            :class="priorityClass(task.priority || 'MEDIUM')"
            :value="task.priority || 'MEDIUM'"
            @change="$emit('change-priority', task.id, $event.target.value)"
            @click.stop
          >
            <option value="HIGH">{{ t('tables.tasks.priorityHigh') }}</option>
            <option value="MEDIUM">{{ t('tables.tasks.priorityMedium') }}</option>
            <option value="LOW">{{ t('tables.tasks.priorityLow') }}</option>
          </select>

          <select
            class="status-select"
            :class="badgeClass(task.status)"
            :value="task.status"
            @change="$emit('change-status', task.id, $event.target.value)"
            @click.stop
          >
            <option value="PENDING">{{ t('tables.tasks.pending') }}</option>
            <option value="IN_PROGRESS">{{ t('tables.tasks.inProgress') }}</option>
            <option value="DONE">{{ t('tables.tasks.completed') }}</option>
          </select>
        </div>
      </div>

      <div v-if="tasks.length === 0" class="empty">
        {{ t('tables.tasks.empty') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

defineProps({
  tasks: { type: Array, default: () => [] }
});

defineEmits(['toggle-task', 'change-status', 'change-priority', 'edit']);

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

function badgeClass(status) {
  if (status === 'DONE') return 'sel-completed';
  if (status === 'IN_PROGRESS') return 'sel-progress';
  return 'sel-pending';
}

function typeBadgeClass(type) {
  return type === 'REMINDER' ? 'type-reminder' : 'type-task';
}

function priorityClass(priority) {
  if (priority === 'HIGH') return 'priority-high';
  if (priority === 'LOW') return 'priority-low';
  return 'priority-medium';
}
</script>

<style scoped>
.tasks-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 16px 20px;
}

.task-list {
  display: grid;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border-left: 4px solid var(--brand-main);
  transition: background 0.15s ease;
}

.task-item:hover {
  background: var(--bg-main);
}

.task-item.clickable {
  cursor: pointer;
}

.task-completed {
  border-left-color: var(--secondary-sage);
}

.task-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 2px solid var(--brand-main);
  accent-color: var(--secondary-sage);
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
}

.task-completed .task-checkbox {
  border-color: var(--secondary-sage);
}

.task-body {
  flex: 1;
  min-width: 0;
}

.task-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--brand-main);
  word-break: break-word;
}

.task-name.done {
  text-decoration: line-through;
  opacity: 0.6;
}

.task-desc {
  font-size: 13px;
  color: var(--neutral-500);
  margin-top: 4px;
  word-break: break-word;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
  font-size: 13px;
  color: var(--neutral-500);
}

.task-due {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-type-badge {
  display: inline-block;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.type-task {
  background: rgba(191, 210, 164, 0.35);
  color: var(--brand-main);
}

.type-reminder {
  background: #fef9c3;
  color: #854d0e;
}

/* Priority badges */
.task-priority-badge {
  display: inline-block;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.priority-high {
  background: #fee2e2;
  color: #b91c1c;
}

.priority-medium {
  background: #fef9c3;
  color: #854d0e;
}

.priority-low {
  background: #e0f2fe;
  color: #0369a1;
}

/* Priority left border colors */
.task-item.border-high {
  border-left-color: #b91c1c;
}

.task-item.border-medium {
  border-left-color: #ca8a04;
}

.task-item.border-low {
  border-left-color: #0369a1;
}

/* Status & Priority dropdowns */
.task-selects {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.status-select,
.priority-select {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  outline: none;
  appearance: auto;
}

.sel-completed {
  background: rgba(191, 210, 164, 0.45);
  color: var(--brand-main);
}

.sel-progress {
  background: #fef9c3;
  color: #854d0e;
}

.sel-pending {
  background: var(--neutral-200);
  color: var(--neutral-700);
}

.empty {
  text-align: center;
  padding: 32px 16px;
  color: var(--neutral-500);
  font-size: 14px;
}

@media (max-width: 640px) {
  .task-item {
    padding: 12px 14px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .task-checkbox {
    width: 20px;
    height: 20px;
  }
  .task-name {
    font-size: 14px;
  }
  .task-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .task-selects {
    width: 100%;
  }
  .status-select,
  .priority-select {
    width: 100%;
  }
}
</style>
