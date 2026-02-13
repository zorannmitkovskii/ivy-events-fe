<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <h1 class="dash-page-title">{{ t('tables.tasks.title') }}</h1>
    </div>

    <DashboardToolbar>
      <template #actions>
        <ButtonMain variant="main" @click="openTaskModal">
          {{ t('tables.tasks.addTask') }}
        </ButtonMain>
        <ButtonMain variant="gold" @click="openReminderModal">
          {{ t('tables.tasks.setReminder') }}
        </ButtonMain>
      </template>
    </DashboardToolbar>

    <TasksPanel
      :tasks="tasks"
      @toggle-task="handleToggle"
      @change-status="handleChangeStatus"
    />

    <AddTaskModal
      :open="modalOpen"
      :type="modalType"
      @close="modalOpen = false"
      @submit="handleAddTask"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import DashboardToolbar from '@/components/dashboard/DashboardToolbar.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';
import TasksPanel from '@/components/dashboard/tables/TasksPanel.vue';
import AddTaskModal from '@/components/dashboard/tables/AddTaskModal.vue';
import { useTasks } from '@/composables/useTasks';

const { t } = useI18n();
const { tasks, load, createTask, toggleTask, updateStatus } = useTasks();

const modalOpen = ref(false);
const modalType = ref('TASK');

onMounted(load);

function openTaskModal() {
  modalType.value = 'TASK';
  modalOpen.value = true;
}

function openReminderModal() {
  modalType.value = 'REMINDER';
  modalOpen.value = true;
}

async function handleAddTask(payload) {
  await createTask(payload);
  modalOpen.value = false;
}

async function handleToggle(taskId) {
  await toggleTask(taskId);
}

async function handleChangeStatus(taskId, status) {
  await updateStatus(taskId, status);
}
</script>
