<template>
  <DashboardTable>
    <template #head>
      <th>{{ t('tables.tasks.form.title') }}</th>
      <th>{{ t('tables.tasks.task') }}</th>
      <th>{{ t('tables.tasks.form.priority') }}</th>
      <th>{{ t('tables.tasks.due') }}</th>
      <th>{{ t('tables.tasks.form.status') }}</th>
    </template>

    <template #body>
      <TaskRow
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @toggle-task="$emit('toggle-task', $event)"
        @change-status="(id, val) => $emit('change-status', id, val)"
        @change-priority="(id, val) => $emit('change-priority', id, val)"
        @edit="$emit('edit', $event)"
      />

      <tr v-if="tasks.length === 0">
        <td colspan="5" class="empty-cell">{{ t('tables.tasks.empty') }}</td>
      </tr>
    </template>

    <template v-if="tasks.length > 0" #footer>
      <span class="stat"><strong>{{ tasks.length }}</strong> {{ t('tables.tasks.task').toLowerCase() }}s</span>
      <span class="stat stat-done">{{ doneCount }} {{ t('tables.tasks.completed').toLowerCase() }}</span>
      <span class="stat stat-progress">{{ progressCount }} {{ t('tables.tasks.inProgress').toLowerCase() }}</span>
      <span class="stat stat-pending">{{ pendingCount }} {{ t('tables.tasks.pending').toLowerCase() }}</span>
    </template>
  </DashboardTable>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DashboardTable from '@/components/dashboard/DashboardTable.vue';
import TaskRow from './TaskRow.vue';

const { t } = useI18n();

const props = defineProps({
  tasks: { type: Array, default: () => [] }
});

defineEmits(['toggle-task', 'change-status', 'change-priority', 'edit']);

const doneCount = computed(() => props.tasks.filter(task => task.status === 'DONE').length);
const progressCount = computed(() => props.tasks.filter(task => task.status === 'IN_PROGRESS').length);
const pendingCount = computed(() => props.tasks.filter(task => task.status === 'PENDING').length);
</script>

<style scoped>
.empty-cell {
  text-align: center;
  padding: 32px 24px !important;
  color: var(--dash-muted);
  font-size: 13px;
}

.stat strong { color: var(--dash-ink); }
.stat-done { color: var(--dash-sage); font-weight: 600; }
.stat-progress { color: var(--dash-gold); font-weight: 600; }
.stat-pending { color: var(--dash-muted); font-weight: 600; }
</style>
