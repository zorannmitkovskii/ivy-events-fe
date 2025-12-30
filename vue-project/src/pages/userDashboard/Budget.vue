<template>
  <DashboardLayout>
    <div class="container py-4">
      <h1 class="text-brand-dark mb-4">Budget</h1>

      <!-- Filters -->
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-4">
              <label class="form-label">Status</label>
              <select class="form-select" v-model="filters.status">
                <option value="">All</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-brand-dark w-100" @click="applyFilters">
                Apply Filters
              </button>
            </div>
            <div class="col-md-6 text-end">
              <button class="btn btn-brand-dark" @click="openCreateModal">
                + Add Expense
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress Toward Bar -->
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <h5 class="text-brand-dark mb-2">Budget Progress</h5>
          <div class="progress" style="height: 30px;">
            <div
              class="progress-bar bg-success"
              role="progressbar"
              :style="{ width: paidPercentage + '%' }"
            >
              Paid {{ paidPercentage }}%
            </div>
            <div
              class="progress-bar bg-warning text-dark"
              role="progressbar"
              :style="{ width: pendingPercentage + '%' }"
            >
              Pending {{ pendingPercentage }}%
            </div>
          </div>
          <small class="text-muted mt-2 d-block">
            Total Budget: {{ totalBudget.toFixed(2) }} | Paid: {{ totalPaid.toFixed(2) }} | Pending: {{ totalPending.toFixed(2) }}
          </small>
        </div>
      </div>

      <!-- Budget Table -->
      <div class="card shadow-sm mb-4">
        <div class="card-body table-responsive">
          <table class="table table-striped align-middle">
            <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th style="width: 140px;">Actions</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(b, index) in paginatedBudget" :key="b.id">
              <td>{{ index + 1 + (page - 1) * pageSize }}</td>
              <td>{{ b.title }}</td>
              <td>{{ b.category }}</td>
              <td>{{ b.amount.toFixed(2) }}</td>
              <td>{{ b.date }}</td>
              <td>
                <span :class="statusBadge(b.status)">{{ b.status }}</span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-1" @click="openEditModal(b)">Edit</button>
                <button class="btn btn-sm btn-outline-danger" @click="deleteBudget(b.id)">Delete</button>
              </td>
            </tr>
            <tr v-if="filteredBudget.length === 0">
              <td colspan="7" class="text-center py-3 text-muted">No budget items found.</td>
            </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="d-flex justify-content-between align-items-center mt-3">
            <small class="text-muted">
              Showing {{ paginatedBudget.length }} of {{ filteredBudget.length }} items
            </small>
            <nav>
              <ul class="pagination pagination-sm m-0">
                <li class="page-item" :class="{ disabled: page === 1 }">
                  <button class="page-link" @click="goPage(page - 1)">Prev</button>
                </li>
                <li class="page-item" v-for="p in totalPages" :key="p" :class="{ active: page === p }">
                  <button class="page-link" @click="goPage(p)">{{ p }}</button>
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
      <div class="modal fade" id="budgetModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-brand-light">
              <h5 class="modal-title text-brand-dark">{{ isEditing ? "Edit Expense" : "Add Expense" }}</h5>
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
                <label class="form-label">Amount</label>
                <input type="number" class="form-control" v-model.number="modalForm.amount" />
              </div>
              <div class="mb-3">
                <label class="form-label">Date</label>
                <input type="date" class="form-control" v-model="modalForm.date" />
              </div>
              <div class="mb-3">
                <label class="form-label">Status</label>
                <select class="form-select" v-model="modalForm.status">
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button class="btn btn-brand-dark" @click="saveBudget">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import DashboardLayout from "@/components/userDashboard/dashboard/DashboardLayout.vue";
import * as bootstrap from "bootstrap";

const page = ref(1);
const pageSize = 10;

// Dummy budget items
const budget = ref([
  { id: 1, title: "Venue", category: "Planning", amount: 5000, date: "2025-12-10", status: "Paid" },
  { id: 2, title: "Catering", category: "Food", amount: 2000, date: "2025-12-12", status: "Pending" },
  { id: 3, title: "Photography", category: "Photography", amount: 1500, date: "2025-12-05", status: "Paid" },
]);

const filters = reactive({ status: "" });
let modal;
const isEditing = ref(false);
const modalForm = reactive({ id: null, title: "", category: "", amount: 0, date: "", status: "Pending" });

onMounted(() => {
  modal = new bootstrap.Modal(document.getElementById("budgetModal"));
});

// Filtered budget
const filteredBudget = computed(() => {
  return budget.value.filter(b => (filters.status ? b.status === filters.status : true));
});

// Paginated budget
const paginatedBudget = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredBudget.value.slice(start, start + pageSize);
});

const totalPages = computed(() => Math.ceil(filteredBudget.value.length / pageSize));

function applyFilters() { page.value = 1; }
function goPage(newPage) { if (newPage >= 1 && newPage <= totalPages.value) page.value = newPage; }
function openCreateModal() { isEditing.value = false; Object.assign(modalForm, { id: null, title: "", category: "", amount: 0, date: "", status: "Pending" }); modal.show(); }
function openEditModal(item) { isEditing.value = true; Object.assign(modalForm, item); modal.show(); }
function saveBudget() {
  if (isEditing.value) {
    const index = budget.value.findIndex(b => b.id === modalForm.id);
    if (index !== -1) budget.value[index] = { ...modalForm };
  } else { modalForm.id = budget.value.length + 1; budget.value.push({ ...modalForm }); }
  modal.hide();
}
function deleteBudget(id) { if (confirm("Are you sure you want to delete this item?")) budget.value = budget.value.filter(b => b.id !== id); }
function statusBadge(status) { return { "badge bg-success": status === "Paid", "badge bg-warning text-dark": status === "Pending" }; }

// Progress calculations
const totalPaid = computed(() => budget.value.filter(b => b.status === "Paid").reduce((sum, b) => sum + b.amount, 0));
const totalPending = computed(() => budget.value.filter(b => b.status === "Pending").reduce((sum, b) => sum + b.amount, 0));
const totalBudget = computed(() => 10000 + totalPaid.value + totalPending.value);
const paidPercentage = computed(() => totalBudget.value ? Math.round((totalPaid.value / totalBudget.value) * 100) : 0);
const pendingPercentage = computed(() => totalBudget.value ? Math.round((totalPending.value / totalBudget.value) * 100) : 0);
</script>

<style scoped>
.btn-brand-dark { background-color: var(--logo-brown); color: white; }
.btn-brand-dark:hover { background-color: #704e2f; }
.bg-brand-light { background-color: var(--brand-light); }
.text-brand-dark { color: var(--logo-brown); }
.table-striped > tbody > tr:nth-of-type(odd) { background-color: #f9f4ef; }
</style>
