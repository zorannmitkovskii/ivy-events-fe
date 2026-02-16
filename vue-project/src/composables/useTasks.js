import { ref, computed } from "vue";
import { tasksService } from "@/services/tasks.service";
import { onboardingStore } from "@/store/onboarding.store";

export function useTasks() {
  const eventId = computed(() => onboardingStore.eventId);

  const tasks = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const list = await tasksService.list(eventId.value);
      tasks.value = Array.isArray(list) ? list : [];
    } catch (e) {
      error.value = e?.message || "Failed to load tasks";
      if (eventId.value === "demo") {
        tasks.value = getDemoTasks();
      }
    } finally {
      loading.value = false;
    }
  }

  async function createTask(payload) {
    const created = await tasksService.create({ ...payload, eventId: eventId.value });
    tasks.value.push(created);
    return created;
  }

  async function toggleTask(taskId) {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === "DONE" ? "PENDING" : "DONE";
    await tasksService.updateStatus(taskId, { status: newStatus });
    task.status = newStatus;
  }

  async function updateStatus(taskId, status) {
    await tasksService.updateStatus(taskId, { status });
    const task = tasks.value.find((t) => t.id === taskId);
    if (task) task.status = status;
  }

  async function updateTask(taskId, payload) {
    const updated = await tasksService.update(taskId, payload);
    const idx = tasks.value.findIndex((t) => t.id === taskId);
    if (idx !== -1) tasks.value[idx] = updated;
    return updated;
  }

  async function removeTask(taskId) {
    await tasksService.remove(taskId);
    tasks.value = tasks.value.filter((t) => t.id !== taskId);
  }

  return {
    tasks,
    loading,
    error,
    load,
    createTask,
    updateTask,
    toggleTask,
    updateStatus,
    removeTask
  };
}

function getDemoTasks() {
  return [
    { id: 1, title: "Book venue and confirm date", dueDate: "2025-01-15", status: "COMPLETED", type: "TASK" },
    { id: 2, title: "Send invitations to guests", dueDate: "2025-01-20", status: "IN_PROGRESS", type: "TASK" },
    { id: 3, title: "Finalize menu with catering service", dueDate: "2025-01-25", status: "PENDING", type: "TASK" },
    { id: 4, title: "Order decorations and centerpieces", dueDate: "2025-01-18", status: "COMPLETED", type: "TASK" },
    { id: 5, title: "Arrange transportation for guests", dueDate: "2025-02-01", status: "PENDING", type: "REMINDER" },
    { id: 6, title: "Confirm photographer and videographer", dueDate: "2025-01-28", status: "IN_PROGRESS", type: "REMINDER" }
  ];
}
