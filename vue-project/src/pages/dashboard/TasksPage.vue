<template>
  <div class="dash-page">
    <PageHeader :title="t('tables.tasks.title')" />

    <DashboardToolbar>
      <template #actions>
        <div class="view-toggle" role="group" :aria-label="t('tables.tasks.board.view')">
          <button
            type="button"
            :class="{ on: view === 'table' }"
            :aria-pressed="view === 'table'"
            @click="setView('table')"
          >{{ t('tables.tasks.board.asTable') }}</button>
          <button
            type="button"
            :class="{ on: view === 'board' }"
            :aria-pressed="view === 'board'"
            @click="setView('board')"
          >{{ t('tables.tasks.board.asBoard') }}</button>
        </div>
        <ButtonMain variant="main" @click="openTaskModal">
          {{ t('tables.tasks.addTask') }}
        </ButtonMain>
        <ButtonMain variant="outline" @click="openReminderModal">
          {{ t('tables.tasks.setReminder') }}
        </ButtonMain>
      </template>
    </DashboardToolbar>

    <TasksPanel
      v-if="view === 'table'"
      :tasks="tasks"
      @toggle-task="handleToggle"
      @change-status="handleChangeStatus"
      @change-priority="handleChangePriority"
      @edit="openEditModal"
    />

    <template v-else>
      <p class="board-hint">{{ t('tables.tasks.board.hint') }}</p>
      <TaskBoard
        :tasks="tasks"
        :assignees="assignees"
        @reorder="handleReorder"
        @move="handleMove"
        @assign="handleAssign"
        @edit="openEditModal"
      />
    </template>

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
import PageHeader from '@/components/ui/PageHeader.vue'
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import DashboardToolbar from '@/components/dashboard/DashboardToolbar.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';
import TasksPanel from '@/components/dashboard/tables/TasksPanel.vue';
import TaskBoard from '@/components/dashboard/tables/TaskBoard.vue';
import { taskBoardService } from '@/services/taskBoard.service';
import AddTaskModal from '@/components/dashboard/tables/AddTaskModal.vue';
import { useTasks } from '@/composables/useTasks';
import { onboardingStore } from '@/store/onboarding.store';

/*
  Remembered per browser rather than per account. Which view somebody
  prefers is a property of the screen they are sitting at, and storing it on
  the server would mean a round trip before the first paint to answer a
  question the browser already knows.
*/
const VIEW_KEY = 'ivy.tasks.view';

function savedView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'board' ? 'board' : 'table';
  } catch {
    // Private browsing, or storage blocked. The table is the safe default.
    return 'table';
  }
}

const view = ref(savedView());

function setView(next) {
  view.value = next;
  if (next === 'board') loadAssignees();
  try {
    localStorage.setItem(VIEW_KEY, next);
  } catch {
    // Not worth telling anybody about; the choice just will not survive.
  }
}

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { tasks, load, createTask, updateTask, toggleTask, updateStatus, updatePriority } = useTasks();

const assignees = ref([]);

/*
  Loaded once when the board is first shown. An event with no agency behind
  it has nobody to assign to, and the endpoint answers with an empty list
  rather than an error — so the picker simply stays disabled.
*/
async function loadAssignees() {
  const eventId = onboardingStore.eventId;
  if (!eventId || assignees.value.length) return;
  try {
    const response = await taskBoardService.assignable(eventId);
    assignees.value = response?.data?.data ?? response?.data ?? [];
  } catch {
    // The board still works; only the picker is missing its names.
  }
}

async function handleReorder(status, taskIds) {
  const eventId = onboardingStore.eventId;
  if (!eventId) return;
  await taskBoardService.reorder(eventId, status, taskIds);
  // Reload rather than patch in place: the server decides the numbering,
  // and two copies of an order is how the two stop matching.
  await load();
}

async function handleMove(taskId, status, taskIds) {
  const eventId = onboardingStore.eventId;
  if (!eventId) return;
  await taskBoardService.move(eventId, taskId, status, taskIds);
  await load();
}

async function handleAssign(taskId, assigneeUserId) {
  const eventId = onboardingStore.eventId;
  if (!eventId) return;
  await taskBoardService.assign(eventId, taskId, assigneeUserId);
  await load();
}

const modalOpen = ref(false);
const modalType = ref('TASK');
const editingTask = ref(null);

onMounted(async () => {
  await load();
  if (view.value === 'board') loadAssignees();
});

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

async function handleChangePriority(taskId, priority) {
  await updatePriority(taskId, priority);
}
</script>
