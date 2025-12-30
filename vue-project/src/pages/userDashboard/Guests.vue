<template>
  <DashboardLayout>
    <div class="container py-4">
      <h1 class="text-brand-dark mb-4">Guests</h1>

      <!-- Filters -->
      <div class="row mb-3 g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label">Filter by Side</label>
          <select class="form-select" v-model="filters.side" @change="applyFilters">
            <option value="">All</option>
            <option value="Groom">Groom</option>
            <option value="Bride">Bride</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Filter by Table</label>
          <select class="form-select" v-model="filters.table" @change="applyFilters">
            <option value="">All</option>
            <option v-for="t in tables" :key="t.id" :value="t.number">Table {{ t.number }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <button class="btn btn-brand-dark w-100" @click="resetFilters">Reset Filters</button>
        </div>
      </div>

      <!-- Guests Table -->
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-brand-light d-flex justify-content-between align-items-center">
          <h5 class="m-0 text-brand-dark">Guest List</h5>
          <button class="btn btn-brand-dark btn-sm" @click="openCreateModal">+ Add Guest</button>
        </div>

        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped align-middle">
              <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Side</th>
                <th>Table</th>
                <th style="width: 140px;">Actions</th>
              </tr>
              </thead>

              <tbody>
              <tr v-for="(guest, index) in filteredGuests" :key="guest.id">
                <td>{{ index + 1 }}</td>
                <td>{{ guest.name }}</td>
                <td>{{ guest.email || '-' }}</td>
                <td>{{ guest.phone || '-' }}</td>
                <td>{{ guest.side }}</td>
                <td>{{ guest.table }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" @click="openEditModal(guest)">Edit</button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteGuest(guest.id)">Delete</button>
                </td>
              </tr>

              <tr v-if="filteredGuests.length === 0">
                <td colspan="7" class="text-center py-3 text-muted">
                  No guests found.
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Create / Edit Guest -->
      <div class="modal fade" id="guestModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-brand-light">
              <h5 class="modal-title text-brand-dark">{{ isEditing ? "Edit Guest" : "Add Guest" }}</h5>
              <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Name</label>
                  <input class="form-control" v-model="modalForm.name" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" v-model="modalForm.email" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Phone</label>
                  <input class="form-control" v-model="modalForm.phone" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Side</label>
                  <select class="form-select" v-model="modalForm.side">
                    <option value="Groom">Groom</option>
                    <option value="Bride">Bride</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Table</label>
                  <select class="form-select" v-model="modalForm.table">
                    <option v-for="t in tables" :key="t.id" :value="t.number">Table {{ t.number }}</option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label">Notes</label>
                  <textarea class="form-control" rows="3" v-model="modalForm.notes"></textarea>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button class="btn btn-brand-dark" @click="saveGuest">Save Guest</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from "vue";
import DashboardLayout from "@/components/userDashboard/dashboard/DashboardLayout.vue";
import * as bootstrap from "bootstrap";

// Dummy tables for table selection
const tables = ref([
  { id: 1, number: 1 },
  { id: 2, number: 2 },
  { id: 3, number: 3 },
]);

// Dummy guest data
const guests = ref([
  { id: 101, name: "John Doe", email: "john@example.com", phone: "123456789", side: "Groom", table: 1, notes: "VIP" },
  { id: 102, name: "Jane Smith", email: "jane@example.com", phone: "", side: "Bride", table: 1, notes: "" },
  { id: 103, name: "Michael Johnson", email: "", phone: "987654321", side: "Groom", table: 2, notes: "" },
  { id: 104, name: "Emily Davis", email: "emily@example.com", phone: "", side: "Bride", table: 2, notes: "Allergic to nuts" },
  { id: 105, name: "Sarah Lee", email: "sarah@example.com", phone: "", side: "Bride", table: 3, notes: "" },
]);

const filters = reactive({
  side: "",
  table: "",
});

const isEditing = ref(false);

const modalForm = reactive({
  id: null,
  name: "",
  email: "",
  phone: "",
  side: "Groom",
  table: 1,
  notes: "",
});

let modal;
onMounted(() => {
  modal = new bootstrap.Modal(document.getElementById("guestModal"));
});

// Computed filtered guests
const filteredGuests = computed(() => {
  return guests.value.filter(g => {
    const sideMatch = filters.side ? g.side === filters.side : true;
    const tableMatch = filters.table ? g.table === Number(filters.table) : true;
    return sideMatch && tableMatch;
  });
});

// Modal functions
function openCreateModal() {
  isEditing.value = false;
  Object.assign(modalForm, {
    id: null,
    name: "",
    email: "",
    phone: "",
    side: "Groom",
    table: 1,
    notes: "",
  });
  modal.show();
}

function openEditModal(guest) {
  isEditing.value = true;
  Object.assign(modalForm, guest);
  modal.show();
}

// Save guest in dummy data
function saveGuest() {
  if (isEditing.value) {
    const index = guests.value.findIndex(g => g.id === modalForm.id);
    guests.value[index] = { ...modalForm };
  } else {
    modalForm.id = Date.now();
    guests.value.push({ ...modalForm });
  }
  modal.hide();
}

// Delete guest
function deleteGuest(id) {
  if (!confirm("Do you want to delete this guest?")) return;
  const index = guests.value.findIndex(g => g.id === id);
  guests.value.splice(index, 1);
}

// Filters
function applyFilters() {}
function resetFilters() {
  filters.side = "";
  filters.table = "";
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
.table-striped > tbody > tr:nth-of-type(odd) {
  background-color: #f9f4ef;
}
.card-header.bg-brand-light {
  background-color: #f5f0ea;
}
</style>
