<template>
  <DashboardLayout>
    <div class="container py-4">
      <h1 class="text-brand-dark mb-4">Timeline</h1>

      <!-- Filters -->
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-4">
              <label class="form-label">Filter by Type</label>
              <select class="form-select" v-model="filters.type">
                <option value="">All</option>
                <option value="Task">Task</option>
                <option value="Vendor">Vendor</option>
                <option value="Guest">Guest</option>
                <option value="Budget">Budget</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-brand-dark w-100" @click="applyFilters">Apply</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <ul class="timeline">
            <li v-for="item in filteredTimeline" :key="item.id">
              <span class="timeline-date">{{ item.date }}</span>
              <div class="timeline-content">
                <h6 class="mb-1">{{ item.title }}</h6>
                <small class="text-muted">{{ item.type }}</small>
                <p v-if="item.description">{{ item.description }}</p>
              </div>
            </li>
            <li v-if="filteredTimeline.length === 0" class="text-center text-muted py-3">
              No timeline items found.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { reactive, ref, computed } from "vue";
import DashboardLayout from "@/components/userDashboard/dashboard/DashboardLayout.vue";

// Filters
const filters = reactive({
  type: "",
});

// Dummy timeline data
const timelineItems = ref([
  { id: 1, title: "Book Wedding Venue", type: "Task", date: "2025-11-01", description: "Book the main venue for ceremony and reception." },
  { id: 2, title: "Confirm Photographer", type: "Task", date: "2025-11-05", description: "Finalize the wedding photographer." },
  { id: 3, title: "Catering Contract Signed", type: "Vendor", date: "2025-11-10" },
  { id: 4, title: "Send Invitations", type: "Guest", date: "2025-11-15" },
  { id: 5, title: "Budget Paid: Venue", type: "Budget", date: "2025-11-20" },
  { id: 6, title: "Select Flowers", type: "Task", date: "2025-11-22" },
  { id: 7, title: "Hire DJ", type: "Task", date: "2025-11-25" },
  { id: 8, title: "Decorations Finalized", type: "Task", date: "2025-11-28" },
  { id: 9, title: "Guest RSVP Deadline", type: "Guest", date: "2025-11-30" },
  { id: 10, title: "Final Budget Review", type: "Budget", date: "2025-12-01" },
]);

// Computed filtered timeline
const filteredTimeline = computed(() => {
  return timelineItems.value
    .filter(item => !filters.type || item.type === filters.type)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
});

function applyFilters() {
  // Simply triggers computed to re-evaluate
}
</script>

<style scoped>
.text-brand-dark {
  color: var(--logo-brown);
}
.btn-brand-dark {
  background-color: var(--logo-brown);
  color: white;
}
.btn-brand-dark:hover {
  background-color: #704e2f;
}

/* Timeline styles */
.timeline {
  list-style: none;
  padding-left: 0;
  position: relative;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #e0e0e0;
}
.timeline li {
  position: relative;
  margin-bottom: 20px;
  padding-left: 50px;
}
.timeline li::before {
  content: '';
  position: absolute;
  left: 13px;
  top: 5px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: var(--logo-brown);
}
.timeline-date {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 5px;
  display: block;
}
.timeline-content h6 {
  margin: 0;
}
</style>
