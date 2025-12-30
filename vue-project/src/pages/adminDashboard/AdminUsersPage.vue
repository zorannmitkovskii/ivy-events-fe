<template>
  <AdminLayout pageTitle="Users">
    <div class="container-fluid">

      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="text-brand-dark">Manage Users</h4>

        <button class="btn btn-primary" @click="openCreate">
          <i class="bi bi-plus-lg"></i>
          Add User
        </button>
      </div>

      <!-- FILTER -->
      <div class="mb-3">
        <label>User Role</label>
        <select class="form-select w-auto"
                v-model="roleFilter">
          <option value="">All</option>
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
          <option value="User">User</option>
        </select>
      </div>

      <!-- TABLE -->
      <AdminTable :headers="headers" :rows="paginated">
        <template #row="{row}">
          <td>{{ row.id }}</td>
          <td>{{ row.name }}</td>
          <td>{{ row.email }}</td>
          <td>{{ row.role }}</td>

          <td>
            <span
              :class="row.active ? 'badge bg-success' : 'badge bg-danger'">
              {{ row.active ? 'Active' : 'Inactive' }}
            </span>
          </td>

          <td width="150">
            <button class="btn btn-sm btn-outline-primary me-2"
                    @click="editUser(row)">
              Edit
            </button>

            <button class="btn btn-sm btn-outline-danger"
                    @click="deleteUser(row)">
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
import {ref, computed} from "vue"
import AdminLayout from "@/components/adminDashboard/AdminLayout.vue"
import AdminTable from "@/components/adminDashboard/AdminTable.vue"
import AdminPagination from "@/components/adminDashboard/AdminPagination.vue"

const headers = ["ID","Name","Email","Role","Status","Actions"]

const users = ref([
  {id:1,name:"John Doe",email:"john@example.com",role:"Admin",active:true},
  {id:2,name:"Sarah Smith",email:"sarah@example.com",role:"Manager",active:false},
  {id:3,name:"David Brown",email:"david@example.com",role:"User",active:true},
  {id:4,name:"Emily White",email:"emily@example.com",role:"User",active:true},
  {id:5,name:"Alex Green",email:"alex@example.com",role:"Manager",active:false},
  {id:6,name:"Michael Blue",email:"michael@example.com",role:"User",active:true},
  {id:7,name:"Jane Gold",email:"jane@example.com",role:"User",active:true},
])

/* ===== FILTER ===== */
const roleFilter = ref("")

const filtered = computed(() =>
  roleFilter.value
    ? users.value.filter(u => u.role === roleFilter.value)
    : users.value
)

/* ===== PAGINATION ===== */
const page = ref(1)
const perPage = 5

const totalPages = computed(() =>
  Math.ceil(filtered.value.length / perPage)
)

const paginated = computed(()=>
  filtered.value.slice((page.value-1)*perPage, page.value*perPage)
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

/* ===== ACTIONS ===== */
function openCreate(){ alert("create user") }
function editUser(user){ alert("edit "+user.name) }
function deleteUser(user){ alert("delete "+user.name) }

</script>
