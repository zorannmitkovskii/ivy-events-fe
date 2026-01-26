<template>
  <AdminLayout pageTitle="Categories">
    <div class="container-fluid">

      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="text-brand-dark">Manage Categories</h4>
        <button class="btn btn-main" @click="createCategory">
          <i class="bi bi-plus-lg"></i>
          Add Category
        </button>
      </div>

      <!-- FILTER -->
      <AdminSelectFilter
        label="Type"
        v-model="selectedType"
        :options="types"
      />

      <!-- TABLE -->
      <AdminTable :headers="headers" :rows="paginated">
        <template #row="{row}">
          <td>{{ row.id }}</td>
          <td>{{ row.name }}</td>
          <td>{{ row.type }}</td>

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
import {computed, ref} from "vue"

import AdminLayout from "@/components/adminDashboard/AdminLayout.vue"
import AdminTable from "@/components/adminDashboard/AdminTable.vue"
import AdminPagination from "@/components/adminDashboard/AdminPagination.vue"
import AdminSelectFilter from "@/components/adminDashboard/AdminSelectFilter.vue"

/* ---- mock categories ---- */
const categories = ref([
  {id:1, name:"Wedding",        type:"Event"},
  {id:2, name:"Kids Birthday",  type:"Event"},
  {id:3, name:"Adult Birthday", type:"Event"},
  {id:4, name:"Flowers",        type:"Service"},
  {id:5, name:"Catering",       type:"Service"},
  {id:6, name:"Music",          type:"Service"},
])

/* ---- table headers ---- */
const headers = [
  "ID",
  "Name",
  "Type",
  "Actions"
]

/* ---- dynamic types ---- */
const types = computed(() =>
  [...new Set(categories.value.map(c => c.type))]
)

/* ---- filters ---- */
const selectedType = ref("")

const filtered = computed(() =>
  selectedType.value
    ? categories.value.filter(c => c.type === selectedType.value)
    : categories.value
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

/* ---- actions ---- */
function createCategory(){ alert("Create category") }
function edit(row){ alert("Edit: " + row.name) }
function remove(row){ alert("Remove: " + row.name) }
</script>
