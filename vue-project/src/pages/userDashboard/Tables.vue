<template>
  <DashboardLayout>
    <div class="container py-4">
      <h1 class="text-brand-dark mb-4">Guest Seating</h1>

      <!-- Tables Layout -->
      <div class="row g-4">
        <div
          class="col-md-4"
          v-for="table in tables"
          :key="table.id"
        >
          <div class="card shadow-sm">
            <div class="card-header bg-brand-light d-flex justify-content-between align-items-center">
              <h5 class="m-0 text-brand-dark">Table {{ table.number }}</h5>
              <button class="btn btn-sm btn-outline-primary" @click="openAddGuestModal(table.id)">
                + Add Guest
              </button>
            </div>

            <div class="card-body">
              <ul class="list-group">
                <li
                  class="list-group-item d-flex justify-content-between align-items-center"
                  v-for="guest in table.guests"
                  :key="guest.id"
                >
                  <div>
                    {{ guest.name }}<br />
                    <small class="text-muted">{{ guest.email || guest.phone }}</small>
                  </div>
                  <button
                    class="btn btn-sm btn-outline-secondary"
                    @click="openEditModal(guest)"
                  >
                    Edit
                  </button>
                </li>
                <li v-if="table.guests.length === 0" class="list-group-item text-muted text-center">
                  No guests assigned
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Create / Edit Guest -->
      <div class="modal fade" id="guestModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-brand-light">
              <h5 class="modal-title text-brand-dark">
                {{ isEditing ? "Edit Guest" : "Add Guest" }}
              </h5>
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
                  <label class="form-label">Table</label>
                  <select class="form-select" v-model="modalForm.tableId">
                    <option v-for="t in tables" :key="t.id" :value="t.id">Table {{ t.number }}</option>
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
import { reactive, ref, onMounted } from "vue";
import DashboardLayout from "@/components/userDashboard/dashboard/DashboardLayout.vue";
import * as bootstrap from "bootstrap";

// Dummy data for tables and guests
const tables = ref([
  {
    id: 1,
    number: 1,
    guests: [
      { id: 101, name: "John Doe", email: "john@example.com", phone: "123456789", tableId: 1, notes: "VIP" },
      { id: 102, name: "Jane Smith", email: "jane@example.com", phone: "", tableId: 1, notes: "" },
    ],
  },
  {
    id: 2,
    number: 2,
    guests: [
      { id: 103, name: "Michael Johnson", email: "", phone: "987654321", tableId: 2, notes: "" },
      { id: 104, name: "Emily Davis", email: "emily@example.com", phone: "", tableId: 2, notes: "Allergic to nuts" },
    ],
  },
  {
    id: 3,
    number: 3,
    guests: [],
  },
]);

let modal;
const isEditing = ref(false);

const modalForm = reactive({
  id: null,
  name: "",
  email: "",
  phone: "",
  tableId: null,
  notes: "",
});

onMounted(() => {
  modal = new bootstrap.Modal(document.getElementById("guestModal"));
});

// Open modal to add a guest directly to a table
function openAddGuestModal(tableId) {
  isEditing.value = false;
  Object.assign(modalForm, {
    id: null,
    name: "",
    email: "",
    phone: "",
    tableId: tableId,
    notes: "",
  });
  modal.show();
}

// Open modal to edit a guest
function openEditModal(guest) {
  isEditing.value = true;
  Object.assign(modalForm, guest);
  modal.show();
}

// Save or update guest in dummy data
function saveGuest() {
  if (isEditing.value) {
    // Update guest in the tables array
    const table = tables.value.find(t => t.id === modalForm.tableId);
    // Remove from old table
    tables.value.forEach(t => {
      const index = t.guests.findIndex(g => g.id === modalForm.id);
      if (index !== -1) t.guests.splice(index, 1);
    });
    // Add to new table
    table.guests.push({ ...modalForm });
  } else {
    // Assign a new ID
    modalForm.id = Date.now();
    const table = tables.value.find(t => t.id === modalForm.tableId);
    table.guests.push({ ...modalForm });
  }
  modal.hide();
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
.card-header.bg-brand-light {
  background-color: #f5f0ea;
}
</style>
