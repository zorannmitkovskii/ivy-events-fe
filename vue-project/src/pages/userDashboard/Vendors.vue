<template>
  <DashboardLayout>
    <div class="container py-4">
      <h1 class="text-brand-dark mb-4">Vendors</h1>

      <!-- Filters -->
      <div class="row mb-3 g-3 align-items-end">
        <div class="col-md-4">
          <label class="form-label">Filter by Category / Type</label>
          <select class="form-select" v-model="filters.type" @change="applyFilters">
            <option value="">All</option>
            <optgroup v-for="(types, category) in vendorGroups" :label="category" :key="category">
              <option v-for="type in types" :key="type" :value="type">{{ type.replaceAll('_', ' ') }}</option>
            </optgroup>
          </select>
        </div>
        <div class="col-md-2">
          <button class="btn btn-brand-dark w-100" @click="resetFilters">Reset Filters</button>
        </div>
      </div>

      <!-- Vendors Table -->
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-brand-light d-flex justify-content-between align-items-center">
          <h5 class="m-0 text-brand-dark">Vendor List</h5>
          <button class="btn btn-brand-dark btn-sm" @click="openCreateModal">+ Add Vendor</button>
        </div>

        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped align-middle">
              <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Type</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Price (€)</th>
                <th style="width: 140px;">Actions</th>
              </tr>
              </thead>

              <tbody>
              <tr v-for="(vendor, index) in filteredVendors" :key="vendor.id">
                <td>{{ index + 1 }}</td>
                <td>{{ vendor.name }}</td>
                <td>{{ vendor.type.replaceAll('_', ' ') }}</td>
                <td>{{ vendor.phone || '-' }}</td>
                <td>{{ vendor.email || '-' }}</td>
                <td>{{ vendor.price ? vendor.price + ' €' : '-' }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" @click="openEditModal(vendor)">Edit</button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteVendor(vendor.id)">Delete</button>
                </td>
              </tr>

              <tr v-if="filteredVendors.length === 0">
                <td colspan="7" class="text-center py-3 text-muted">No vendors found.</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Create / Edit Vendor -->
      <div class="modal fade" id="vendorModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-brand-light">
              <h5 class="modal-title text-brand-dark">{{ isEditing ? "Edit Vendor" : "Add Vendor" }}</h5>
              <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Name</label>
                  <input class="form-control" v-model="modalForm.name" />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Type</label>
                  <select class="form-select" v-model="modalForm.type">
                    <optgroup v-for="(types, category) in vendorGroups" :label="category" :key="category">
                      <option v-for="type in types" :key="type" :value="type">{{ type.replaceAll('_', ' ') }}</option>
                    </optgroup>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label">Phone</label>
                  <input class="form-control" v-model="modalForm.phone" />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" v-model="modalForm.email" />
                </div>

                <div class="col-md-6">
                  <label class="form-label">Price (€)</label>
                  <input type="number" class="form-control" v-model="modalForm.price" />
                </div>

                <div class="col-12">
                  <label class="form-label">Notes</label>
                  <textarea class="form-control" rows="3" v-model="modalForm.notes"></textarea>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button class="btn btn-brand-dark" @click="saveVendor">Save Vendor</button>
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

// Grouped vendor types
const vendorGroups = {
  "Wedding Services": ["PHOTOGRAPHY", "BRIDAL_ATTIRE", "GROOM_ATTIRE", "MAKEUP_HAIR"],
  "Decoration & Flowers": ["DECORATION", "FLOWERS", "LIGHTING", "CAKE"],
  "Catering & Food": ["CATERING", "BAR_SERVICE", "FOOD"],
  "Music & Entertainment": ["DJ", "BAND", "ENTERTAINMENT", "HOST_EMCEE"],
  "Planning & Coordination": ["TRAINING_FACILITATOR", "OUTDOOR_ACTIVITY", "TRANSPORTATION", "EQUIPMENT_RENTAL"],
  "Venues & Logistics": ["VENUE", "DECOR_RENTAL"],
  "General Services": ["PRINTING", "SECURITY", "CLEANING", "OTHER"]
};

// Dummy vendors
const vendors = ref([
  { id: 1, name: "John's Photography", type: "PHOTOGRAPHY", phone: "123456789", email: "john@example.com", price: 500, notes: "Outdoor only" },
  { id: 2, name: "Elegant Cakes", type: "CAKE", phone: "", email: "cake@example.com", price: 200, notes: "" },
  { id: 3, name: "DJ Beats", type: "DJ", phone: "987654321", email: "", price: 400, notes: "Special equipment needed" },
]);

const filters = reactive({ type: "" });
const isEditing = ref(false);

const modalForm = reactive({
  id: null,
  name: "",
  type: "OTHER",
  phone: "",
  email: "",
  price: "",
  notes: "",
});

let modal;
onMounted(() => {
  modal = new bootstrap.Modal(document.getElementById("vendorModal"));
});

// Computed filtered vendors
const filteredVendors = computed(() => {
  return vendors.value.filter(v => filters.type ? v.type === filters.type : true);
});

// Modal functions
function openCreateModal() {
  isEditing.value = false;
  Object.assign(modalForm, { id: null, name: "", type: "OTHER", phone: "", email: "", price: "", notes: "" });
  modal.show();
}

function openEditModal(vendor) {
  isEditing.value = true;
  Object.assign(modalForm, vendor);
  modal.show();
}

function saveVendor() {
  if (isEditing.value) {
    const index = vendors.value.findIndex(v => v.id === modalForm.id);
    vendors.value[index] = { ...modalForm };
  } else {
    modalForm.id = Date.now();
    vendors.value.push({ ...modalForm });
  }
  modal.hide();
}

function deleteVendor(id) {
  if (!confirm("Do you want to delete this vendor?")) return;
  const index = vendors.value.findIndex(v => v.id === id);
  vendors.value.splice(index, 1);
}

function applyFilters() {}
function resetFilters() { filters.type = ""; }
</script>

<style scoped>
.btn-brand-dark { background-color: var(--logo-brown); color: white; }
.btn-brand-dark:hover { background-color: #704e2f; }
.table-striped > tbody > tr:nth-of-type(odd) { background-color: #f9f4ef; }
.card-header.bg-brand-light { background-color: #f5f0ea; }
</style>
