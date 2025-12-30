<template>
  <AdminLayout pageTitle="Events">

    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="text-brand-dark">Manage Events</h4>

        <button class="btn btn-primary">
          <i class="bi bi-plus-lg"></i>
          Add Event
        </button>
      </div>

      <div class="card shadow-sm">
        <div class="card-body p-0">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Event Name</th>
              <th>Category</th>
              <th>Organizer</th>
              <th>Date</th>
              <th>Status</th>
              <th width="140">Action</th>
            </tr>
            </thead>

            <tbody>
            <tr v-for="e in events" :key="e.id">
              <td>{{ e.id }}</td>
              <td>{{ e.name }}</td>
              <td>{{ e.category }}</td>
              <td>{{ e.organizer }}</td>
              <td>{{ e.date }}</td>

              <td>
                <span class="badge bg-success" v-if="e.active">Active</span>
                <span class="badge bg-danger" v-else>Inactive</span>
              </td>

              <td>
                <button class="btn btn-sm btn-outline-primary me-1">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger">
                  <i class="bi bi-trash"></i>
                </button>
              </td>

            </tr>
            </tbody>

          </table>
        </div>
        <AdminPagination
          :list="events"
          :page="page"
          @setPage="page=$event"
        />
      </div>
    </div>

  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/adminDashboard/AdminLayout.vue'
import AdminPagination from "@/components/adminDashboard/AdminPagination.vue";

const events = [
  {id:1,name:"Ana & Tome",category:"Wedding",organizer:"Ana",date:"2025-09-19",active:true},
  {id:1,name:"Ana & Tome",category:"Wedding",organizer:"Ana",date:"2025-09-19",active:true},
  {id:1,name:"Ana & Tome",category:"Wedding",organizer:"Ana",date:"2025-09-19",active:true},
  {id:1,name:"Ana & Tome",category:"Wedding",organizer:"Ana",date:"2025-09-19",active:true},
  {id:2,name:"Nikola Birthday",category:"Birthday",organizer:"Nikola",date:"2025-03-01",active:true},
  {id:2,name:"Nikola Birthday",category:"Birthday",organizer:"Nikola",date:"2025-03-01",active:true},
  {id:2,name:"Nikola Birthday",category:"Birthday",organizer:"Nikola",date:"2025-03-01",active:true},
  {id:2,name:"Nikola Birthday",category:"Birthday",organizer:"Nikola",date:"2025-03-01",active:true},
]
</script>
