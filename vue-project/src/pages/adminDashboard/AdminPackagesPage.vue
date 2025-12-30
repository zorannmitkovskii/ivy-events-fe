<template>
  <AdminLayout pageTitle="Packages">
    <div class="container-fluid">

      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="text-brand-dark">Manage Packages</h4>
        <button class="btn btn-primary" @click="createPackage">
          <i class="bi bi-plus-lg"></i>
          Add Package
        </button>
      </div>

      <!-- FILTERS -->
      <AdminSelectFilter
        label="Category"
        v-model="selectedCategory"
        :options="categories"
      />

      <!-- TABLE -->
      <AdminTable :headers="headers" :rows="paginated">
        <template #row="{row}">
          <td>{{ row.id }}</td>
          <td>{{ row.name }}</td>
          <td>{{ row.category }}</td>
          <td>{{ row.price }} €</td>

          <td width="160">
            <button class="btn btn-sm btn-outline-primary me-1"
                    @click="edit(row)">
              Edit
            </button>
            <button class="btn btn-sm btn-outline-danger"
                    @click="remove(row)">
              Delete
            </button>
          </td>
        </template>
      </AdminTable>

      <!-- PAGINATION -->
      <AdminPagination
        :page="page"
        :totalPages="totalPages"
        :startIndex="startIndex"
        :endIndex="endIndex"
        :total="filtered.length"
        @next="next"
        @prev="prev"
        @goto="goto"
      />

    </div>
  </AdminLayout>
</template>

<script setup>
import {computed, ref} from "vue";

import AdminLayout from "@/components/adminDashboard/AdminLayout.vue";
import AdminTable from "@/components/adminDashboard/AdminTable.vue";
import AdminPagination from "@/components/adminDashboard/AdminPagination.vue";
import AdminSelectFilter from "@/components/adminDashboard/AdminSelectFilter.vue";


/* ---- mock data ---- */
const packages = ref([
  {id:1, name:"Golden Wedding",        category:"Wedding",        price:1800},
  {id:2, name:"Premium Baby Shower",   category:"Baby Shower",    price:900},
  {id:3, name:"Kids Super Party",      category:"Kids Birthday",  price:700},
  {id:4, name:"Deluxe Wedding",        category:"Wedding",        price:2400},
  {id:5, name:"Adult Disco Birthday",  category:"Adult Birthday", price:950},
  {id:6, name:"Kids Princess Party",   category:"Kids Birthday",  price:650},
])


/* ---- table headers ---- */
const headers = [
  "ID",
  "Name",
  "Category",
  "Price",
  "Actions"
]


/* ---- category list dynamic ---- */
const categories = computed(() =>
  [...new Set(packages.value.map(p => p.category))]
)


/* ---- filters ---- */
const selectedCategory = ref("")

const filtered = computed(() =>
  selectedCategory.value
    ? packages.value.filter(p => p.category === selectedCategory.value)
    : packages.value
)


/* ---- pagination ---- */
const page = ref(1)
const perPage = 5

const totalPages = computed(() =>
  Math.ceil(filtered.value.length / perPage)
)

const paginated = computed(() =>
  filtered.value.slice((page.value - 1) * perPage, page.value * perPage)
)

const startIndex = computed(() =>
  filtered.value.length === 0 ? 0 : (page.value - 1) * perPage + 1
)

const endIndex = computed(() =>
  Math.min(page.value * perPage, filtered.value.length)
)

function next(){ if(page.value < totalPages.value) page.value++ }
function prev(){ if(page.value > 1) page.value-- }
function goto(n){ page.value = n }


/* ---- events ---- */
function createPackage() { alert("open create") }
function edit(p) { alert("edit " + p.name) }
function remove(p) { alert("delete " + p.name) }
</script>
