<template>
  <div class="dashboard-home">
    <h2 class="text-brand-dark mb-4">Overview</h2>


    <div class="grid-cards d-grid gap-4 mb-4">
      <StatCard title="Days Until Wedding" :value="150" />
      <StatCard title="Guests Confirmed" :value="82" />
      <StatCard title="Budget Used" :value="'40%'" />
    </div>


    <div class="d-grid charts-grid gap-4">
      <ReusableChart title="Guest Attendance" />
      <ReusableChart title="Budget Overview" />
    </div>
  </div>
</template>


<script setup>
import StatCard from "@/components/userDashboard/StatCard.vue";
import ReusableChart from "@/components/userDashboard/ReusableChart.vue";
</script>


<style scoped>
.grid-cards {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
.charts-grid {
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
}
</style>
