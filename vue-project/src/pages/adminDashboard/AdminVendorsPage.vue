<template>
  <AdminLayout pageTitle="Vendors">
    <div class="container-fluid">

      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="text-brand-dark">Manage Vendors</h4>
        <button class="btn btn-main" @click="openCreate">
          <i class="bi bi-plus-lg"></i>
          Add Vendor
        </button>
      </div>

      <!-- FILTERS -->
      <AdminSelectFilter
        label="Category"
        v-model="selectedCategory"
        :options="categories"
      />

      <AdminTable :headers="headers" :rows="paginated">
        <template #row="{row}">
          <td>{{ row.id }}</td>
          <td>{{ row.name }}</td>
          <td>{{ row.category }}</td>
          <td>{{ row.phone }}</td>
          <td>{{ row.city }}</td>

          <td width="140">
            <button class="btn btn-sm btn-outline-primary me-1"
                    @click="edit(row)">Edit</button>

            <button class="btn btn-sm btn-outline-danger"
                    @click="remove(row)">
              Delete
            </button>
          </td>
        </template>
      </AdminTable>

      <AdminPagination
        :page="page"
        :totalPages="totalPages"
        :startIndex="startIndex"
        :endIndex="endIndex"
        :total="filtered.length"
        @prev="prev"
        @next="next"
        @goto="goto"
      />

    </div>
  </AdminLayout>
</template>


<script setup>
import {ref, computed} from 'vue'

import AdminLayout from '@/components/adminDashboard/AdminLayout.vue'
import AdminTable from '@/components/adminDashboard/AdminTable.vue'
import AdminPagination from '@/components/adminDashboard/AdminPagination.vue'
import AdminSelectFilter from '@/components/adminDashboard/AdminSelectFilter.vue'

const headers = ["ID","Name","Category","Phone","City", "Actions"]

const vendors = ref([
  {id:1, name:"Flower Art", category:"Flowers", city:"London", phone:"+44 223"},
  {id:2, name:"Photo & Go", category:"Photography", city:"Barcelona", phone:"+34 99"},
  {id:3, name:"Elegant Cakes", category:"Catering", city:"Madrid", phone:"+34 123"},
  {id:4, name:"DJ Pro", category:"Music", city:"Vienna", phone:"+43 55"},
  {id:5, name:"Moments Studio", category:"Photography", city:"Paris", phone:"+33 23"},
  {id:6, name:"Garden Food", category:"Catering", city:"Berlin", phone:"+49 443"},
])

/* categories dynamically */
const categories = computed(() =>
  [...new Set(vendors.value.map(v => v.category))]
)

/* filter */
const selectedCategory = ref("")

const filtered = computed(() =>
  selectedCategory.value
    ? vendors.value.filter(v => v.category === selectedCategory.value)
    : vendors.value
)

/* pagination */
const page = ref(1)
const perPage = 5

const totalPages = computed(() =>
  Math.ceil(filtered.value.length / perPage)
)

const paginated = computed(() =>
  filtered.value.slice((page.value-1)*perPage, page.value*perPage)
)

const startIndex = computed(() =>
  filtered.value.length ? (page.value - 1) * perPage + 1 : 0
)

const endIndex = computed(() =>
  Math.min(page.value * perPage, filtered.value.length)
)

function next(){ if(page.value<totalPages.value) page.value++ }
function prev(){ if(page.value>1) page.value-- }
function goto(n){ page.value=n }

/* actions */
function openCreate(){ alert("create vendor") }
function edit(v){ alert("edit " + v.name) }
function remove(v){ alert("delete " + v.name) }
</script>
