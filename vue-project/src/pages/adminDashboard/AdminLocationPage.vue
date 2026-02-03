<template>
  <AdminLayout pageTitle="Locations">
    <div class="container-fluid">

      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="text-brand-dark">Manage Locations</h4>
        <button class="btn btn-main" @click="openCreate">
          <i class="bi bi-plus-lg"></i>
          Add Location
        </button>
      </div>

      <div class="card shadow-sm">
        <div class="card-body p-0">
          <AdminTable :rows="paginated" :headers="headers">
            <template #row="{ row }">
              <td>{{ row.id }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.city }}</td>
              <td>{{ row.price }}</td>
              <td width="140">
                <button class="btn btn-sm btn-outline-primary me-1" @click="openEdit(row)">Edit</button>
                <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(row)">Delete</button>
              </td>
            </template>
          </AdminTable>
        </div>
      </div>

      <AdminPagination
        :page="page"
        :totalPages="totalPages"
        :startIndex="startIndex"
        :endIndex="endIndex"
        :total="locations.length"
        @prev="prev"
        @next="next"
        @goto="goto"
      />

      <!-- Modal Create / Edit Location -->
      <div class="modal fade" id="locationModal" tabindex="-1" ref="modalEl">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-brand-light">
              <h5 class="modal-title text-brand-dark">{{ isEditing ? "Edit Location" : "Add Location" }}</h5>
              <button class="btn-close" @click="modal.hide()"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Name</label>
                <input class="form-control" v-model="modalForm.name" />
              </div>
              <div class="mb-3">
                <label class="form-label">City</label>
                <input class="form-control" v-model="modalForm.city" />
              </div>
              <div class="mb-3">
                <label class="form-label">Price</label>
                <input class="form-control" v-model="modalForm.price" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="modal.hide()">Close</button>
              <button class="btn btn-main" @click="saveLocation">{{ isEditing ? "Save Changes" : "Add Location" }}</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import AdminLayout from "@/components/adminDashboard/AdminLayout.vue";
import AdminTable from "@/components/adminDashboard/AdminTable.vue";
import AdminPagination from "@/components/adminDashboard/AdminPagination.vue";
import * as bootstrap from "bootstrap";

// Table headers
const headers = ["ID", "Name", "City", "Price", "Actions"];

// Locations data
const locations = ref([
  { id: 1, name: "Garden Palace", city: "London", price: "$4000" },
  { id: 2, name: "Ocean View", city: "Barcelona", price: "$5200" },
  { id: 3, name: "Mountain Resort", city: "Geneva", price: "$3800" },
  { id: 4, name: "Skyline Tower", city: "Madrid", price: "$4700" },
  { id: 5, name: "Royal Hall", city: "Vienna", price: "$6100" },
  { id: 6, name: "Forest Camp", city: "Klagenfurt", price: "$2900" },
]);

// Pagination
const page = ref(1);
const perPage = 5;
const totalPages = computed(() => Math.ceil(locations.value.length / perPage));
const startIndex = computed(() => (page.value - 1) * perPage);
const endIndex = computed(() => Math.min(startIndex.value + perPage, locations.value.length));
const paginated = computed(() => locations.value.slice(startIndex.value, endIndex.value));

function next() { if (page.value < totalPages.value) page.value++; }
function prev() { if (page.value > 1) page.value--; }
function goto(n) { if (n >= 1 && n <= totalPages.value) page.value = n; }

// ---------- Modal logic ----------
const modalEl = ref(null);
let modal;

const isEditing = ref(false);
const modalForm = reactive({ id: null, name: "", city: "", price: "" });

onMounted(() => {
  modal = new bootstrap.Modal(modalEl.value);
});

function openCreate() {
  isEditing.value = false;
  Object.assign(modalForm, { id: null, name: "", city: "", price: "" });
  modal.show();
}

function openEdit(location) {
  isEditing.value = true;
  Object.assign(modalForm, location);
  modal.show();
}

function saveLocation() {
  if (!modalForm.name || !modalForm.city || !modalForm.price) {
    alert("All fields are required");
    return;
  }

  if (isEditing.value) {
    const index = locations.value.findIndex(l => l.id === modalForm.id);
    if (index !== -1) locations.value[index] = { ...modalForm };
  } else {
    const newId = Math.max(...locations.value.map(l => l.id)) + 1;
    locations.value.push({ ...modalForm, id: newId });
  }

  modal.hide();
}

function confirmDelete(location) {
  if (confirm(`Are you sure you want to delete "${location.name}"?`)) {
    locations.value = locations.value.filter(l => l.id !== location.id);
    if (page.value > totalPages.value) page.value = totalPages.value;
  }
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
