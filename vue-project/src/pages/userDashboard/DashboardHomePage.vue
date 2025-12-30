<template>
  <DashboardLayout>
    <section>
      <div class="stats-grid">
        <StatCard label="Days Until Wedding" :value="days" />
        <StatCard label="Budget Used" :value="budgetPercent + '%'" />
        <StatCard label="Guests Confirmed" :value="confirmed + ' / ' + totalGuests" />
        <StatCard label="Tasks This Week" :value="tasks.length" />
      </div>

      <div class="charts-grid">
        <DonutChart
          title="Budget Overview"
          :labels="budgetLabels"
          :values="budgetValues"
          :colors="budgetColors"
        />

        <DonutChart
          title="Guests Attendance Status"
          :labels="guestLabels"
          :values="guestValues"
          :colors="guestColors"
        />
        <DonutChart
          title="Guests Attendance Status"
          :labels="guestLabels"
          :values="guestValues"
          :colors="guestColors"
        />
      </div>

      <TaskList :tasks="tasks" />
    </section>
  </DashboardLayout>
</template>

<script setup>
import { ref } from 'vue'
import DonutChart from "@/components/userDashboard/dashboard/DonutChart.vue";
import DashboardLayout from "@/components/userDashboard/dashboard/DashboardLayout.vue";
import StatCard from "@/components/userDashboard/dashboard/StatCard.vue";
import TaskList from "@/components/userDashboard/dashboard/TaskList.vue";

/* ---- mocked data (replace with API calls) ---- */
const days = ref(150)
const budgetPercent = ref(40)
const confirmed = ref(82)
const totalGuests = ref(120)

const budgetLabels = ['Venue','Food','Music','Decor','Dress']
const budgetValues = [11000, 8000, 3000, 2000, 1000]
const budgetColors = ['#8C623C','#F0E6DA','#C09B72','#A67C52','#EEDFCC']

const guestLabels = ['Confirmed','Pending','Declined']
const guestValues = [82, 30, 8]
const guestColors = ['#8C623C','#F0E6DA','#C09B72']

const tasks = ['Confirm photographer','Finalize guest list revisions','Venue on-site inspection','Review catering options']
</script>

<style scoped>
/* optional page-level tweaks */
</style>
