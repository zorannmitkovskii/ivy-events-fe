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
        <ButtonMain variant="outline" @click="openReminderModal">
          {{ t('tables.tasks.setReminder') }}
        </ButtonMain>
      </template>
    </DashboardToolbar>

    <TasksPanel
      :tasks="tasks"
      @toggle-task="handleToggle"
      @change-status="handleChangeStatus"
      @edit="openEditModal"
    />

    <AddTaskModal
      :open="modalOpen"
      :type="modalType"
      :task="editingTask"
      @close="closeModal"
      @submit="handleSubmitTask"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import DashboardToolbar from '@/components/dashboard/DashboardToolbar.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';
import TasksPanel from '@/components/dashboard/tables/TasksPanel.vue';
import AddTaskModal from '@/components/dashboard/tables/AddTaskModal.vue';
import { useTasks } from '@/composables/useTasks';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { tasks, load, createTask, updateTask, toggleTask, updateStatus } = useTasks();

const modalOpen = ref(false);
const modalType = ref('TASK');
const editingTask = ref(null);

onMounted(load);

// Auto-open modal when navigated with ?action=add
watch(() => route.query.action, (action) => {
  if (action === "add") {
    openTaskModal();
    router.replace({ ...route, query: {} });
  }
}, { immediate: true });

function openTaskModal() {
  editingTask.value = null;
  modalType.value = 'TASK';
  modalOpen.value = true;
}

function openReminderModal() {
  editingTask.value = null;
  modalType.value = 'REMINDER';
  modalOpen.value = true;
}

function openEditModal(task) {
  editingTask.value = { ...task };
  modalType.value = task.type || 'TASK';
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  editingTask.value = null;
}

async function handleSubmitTask(payload) {
  if (payload.id) {
    await updateTask(payload.id, payload);
  } else {
    await createTask(payload);
  }
  closeModal();
}

async function handleToggle(taskId) {
  await toggleTask(taskId);
}

async function handleChangeStatus(taskId, status) {
  await updateStatus(taskId, status);
}
</script>
