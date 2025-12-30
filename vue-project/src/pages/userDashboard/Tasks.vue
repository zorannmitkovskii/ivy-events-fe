<template>
  <DashboardLayout>
    <div class="container py-4">
      <h1 class="text-brand-dark mb-4">Tasks</h1>

      <!-- Filters -->
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Category</label>
              <input
                type="text"
                class="form-control"
                v-model="filters.category"
                placeholder="Filter by category"
              />
            </div>

            <div class="col-md-3">
              <label class="form-label">Start Date</label>
              <input
                type="date"
                class="form-control"
                v-model="filters.startDate"
              />
            </div>

            <div class="col-md-3">
              <label class="form-label">End Date</label>
              <input
                type="date"
                class="form-control"
                v-model="filters.endDate"
              />
            </div>

            <div class="col-md-2 d-flex align-items-end">
              <button class="btn btn-brand-dark w-100" @click="applyFilters">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Card -->
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-brand-light d-flex justify-content-between align-items-center">
          <h5 class="m-0 text-brand-dark">Task Manager</h5>
          <button class="btn btn-brand-dark btn-sm" @click="openCreateModal">
            + Add Task
          </button>
        </div>

        <div class="card-body">
          <!-- Tasks Table -->
          <div class="table-responsive">
            <table class="table table-striped align-middle">
              <thead>
              <tr>
                <th>#</th>
                <th>Task</th>
                <th>Category</th>
                <th>Due Date</th>
                <th>Status</th>
                <th style="width: 140px;">Actions</th>
              </tr>
              </thead>

              <tbody>
              <tr v-for="(t, index) in paginatedTasks" :key="t.id">
                <td>{{ index + 1 + (page - 1) * pageSize }}</td>
                <td>{{ t.title }}</td>
                <td>{{ t.category || "-" }}</td>
                <td>{{ t.dueDate || "-" }}</td>
                <td>
                    <span :class="statusBadge(t.status)">
                      {{ t.status }}
                    </span>
                </td>
                <td>
                  <button
                    class="btn btn-sm btn-outline-primary me-1"
                    @click="openEditModal(t)"
                  >
                    Edit
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    @click="deleteTask(t.id)"
                  >
                    Delete
                  </button>
                </td>
              </tr>

              <tr v-if="filteredTasks.length === 0">
                <td colspan="6" class="text-center py-3 text-muted">
                  No tasks found.
                </td>
              </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="d-flex justify-content-between align-items-center mt-3">
            <small class="text-muted">
              Showing {{ paginatedTasks.length }} of {{ filteredTasks.length }} tasks
            </small>

            <nav>
              <ul class="pagination pagination-sm m-0">
                <li class="page-item" :class="{ disabled: page === 1 }">
                  <button class="page-link" @click="goPage(page - 1)">Prev</button>
                </li>

                <li
                  class="page-item"
                  v-for="p in totalPages"
                  :key="p"
                  :class="{ active: page === p }"
                >
                  <button class="page-link" @click="goPage(p)">
                    {{ p }}
                  </button>
                </li>

                <li class="page-item" :class="{ disabled: page === totalPages }">
                  <button class="page-link" @click="goPage(page + 1)">Next</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div class="modal fade" id="taskModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-brand-light">
              <h5 class="modal-title text-brand-dark">
                {{ isEditing ? "Edit Task" : "Add Task" }}
              </h5>
              <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Title</label>
                <input class="form-control" v-model="modalForm.title" />
              </div>

              <div class="mb-3">
                <label class="form-label">Category</label>
                <input class="form-control" v-model="modalForm.category" />
              </div>

              <div class="mb-3">
                <label class="form-label">Due Date</label>
                <input
                  type="date"
                  class="form-control"
                  v-model="modalForm.dueDate"
                />
              </div>

              <div class="mb-3">
                <label class="form-label">Status</label>
                <select class="form-select" v-model="modalForm.status">
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">
                Close
              </button>
              <button class="btn btn-brand-dark" @click="saveTask">
                Save Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from "vue";
import * as bootstrap from "bootstrap";
import DashboardLayout from "@/components/userDashboard/dashboard/DashboardLayout.vue";
import axios from "axios";

// Pagination
const page = ref(1);
const pageSize = 10;

// Dummy tasks
const tasks = ref([
  {
    id: 1,
    title: "Book Wedding Venue",
    category: "Planning",
    dueDate: "2025-12-10",
    status: "Pending"
  },
  {
    id: 2,
    title: "Confirm Photographer",
    category: "Photography",
    dueDate: "2025-12-05",
    status: "In Progress"
  },
  // ... keep all your dummy tasks here
]);

// Filters
const filters = reactive({
  category: "",
  startDate: "",
  endDate: ""
});

// Modal
let modal;
const isEditing = ref(false);
const modalForm = reactive({
  id: null,
  title: "",
  category: "",
  dueDate: "",
  status: "Pending"
});

onMounted(() => {
  modal = new bootstrap.Modal(document.getElementById("taskModal"));
});

// Computed filtered tasks
const filteredTasks = computed(() => {
  return tasks.value.filter(t => {
    const categoryMatch = filters.category
      ? t.category?.toLowerCase().includes(filters.category.toLowerCase())
      : true;
    const startMatch = filters.startDate ? t.dueDate >= filters.startDate : true;
    const endMatch = filters.endDate ? t.dueDate <= filters.endDate : true;
    return categoryMatch && startMatch && endMatch;
  });
});

// Computed paginated tasks
const paginatedTasks = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredTasks.value.slice(start, start + pageSize);
});

const totalPages = computed(() => Math.ceil(filteredTasks.value.length / pageSize));

function applyFilters() {
  page.value = 1;
}

function goPage(newPage) {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
}

function openCreateModal() {
  isEditing.value = false;
  Object.assign(modalForm, { id: null, title: "", category: "", dueDate: "", status: "Pending" });
  modal.show();
}

function openEditModal(task) {
  isEditing.value = true;
  Object.assign(modalForm, task);
  modal.show();
}

function saveTask() {
  if (isEditing.value) {
    const index = tasks.value.findIndex(t => t.id === modalForm.id);
    if (index !== -1) tasks.value[index] = { ...modalForm };
  } else {
    modalForm.id = tasks.value.length + 1;
    tasks.value.push({ ...modalForm });
  }
  modal.hide();
}

function deleteTask(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  tasks.value = tasks.value.filter(t => t.id !== id);
}

// Status badge
function statusBadge(status) {
  return {
    "badge bg-warning text-dark": status === "Pending",
    "badge bg-info text-dark": status === "In Progress",
    "badge bg-success": status === "Completed"
  };
}
</script>

<style scoped>
.btn-brand-dark {
  background-color: var(--logo-brown);
  color: white;
}
.btn-brand-dark:hover {
  background-color: #704e2f;
}
.bg-brand-light {
  background-color: var(--brand-light);
}
.text-brand-dark {
  color: var(--logo-brown);
}
.table-striped > tbody > tr:nth-of-type(odd) {
  background-color: #f9f4ef;
}
</style>
