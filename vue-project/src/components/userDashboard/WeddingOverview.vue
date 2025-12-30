<template>
  <div class="col-md-9">
    <div class="container-fluid py-4">
      <!-- Page Title -->
      <h2 class="fw-bold text-brand-dark mb-4">Dashboard Overview</h2>

      <!-- Stats Cards -->
      <div class="row g-4 mb-4">
        <div class="col-md-3">
          <div class="card shadow-sm p-3 bg-brand-light">
            <h6 class="text-muted">Days Until Wedding</h6>
            <h2 class="fw-bold text-brand-dark">150</h2>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card shadow-sm p-3 bg-brand-light">
            <h6 class="text-muted">Budget Used</h6>
            <h2 class="fw-bold text-brand-dark">40%</h2>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card shadow-sm p-3 bg-brand-light">
            <h6 class="text-muted">Guests Confirmed</h6>
            <h2 class="fw-bold text-brand-dark">82 / 120</h2>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card shadow-sm p-3 bg-brand-light">
            <h6 class="text-muted">Tasks This Week</h6>
            <h2 class="fw-bold text-brand-dark">4</h2>
          </div>
        </div>
      </div>

      <ChartContainer
        title1="Budget Overview"
        id1="budgetChart"
        title2="Guests Attendance Status"
        id2="guestsChart"
      />

      <!-- Weekly Tasks -->
      <div class="card shadow-sm p-4">
        <h5 class="fw-bold text-brand-dark mb-3">This Week's Tasks</h5>
        <ul class="list-group list-group-flush">
          <li class="list-group-item">Confirm photographer</li>
          <li class="list-group-item">Finalize guest list revisions</li>
          <li class="list-group-item">Venue on-site inspection</li>
          <li class="list-group-item">Review catering options</li>
        </ul>
      </div>
    </div>

  </div>
</template>

<script>
import { onMounted } from "vue";
import Chart from "chart.js/auto";
import ChartContainer from "@/components/userDashboard/ChartContainer.vue";

export default {
  name: "DashboardHome",
  components: {ChartContainer},
  setup() {
    onMounted(() => {
      // Budget Chart (rewritten as doughnut)
      new Chart(document.getElementById("budgetChart"), {
        type: "doughnut",
        data: {
          labels: ["Venue", "Food", "Music", "Decor", "Dress"],
          datasets: [
            {
              data: [3000, 2500, 1200, 900, 1400], // planned budget
              backgroundColor: [
                "#8C623C",
                "#F0E6DA",
                "#c9b29a",
                "#a3846a",
                "#d6c3b5"
              ]
            }
          ]
        },
        options: {
          cutout: "60%"
        }
      });

      // Guests Chart (unchanged)
      new Chart(document.getElementById("guestsChart"), {
        type: "doughnut",
        data: {
          labels: ["Confirmed", "Pending", "Declined"],
          datasets: [
            {
              data: [82, 30, 8],
              backgroundColor: ["#8C623C", "#F0E6DA", "#c9b29a"],
            }
          ]
        },
        options: {
          cutout: "60%"
        }
      });
    });

    return {};
  }
};
</script>


<style scoped>
.card {
  border-radius: 12px;
}
.sidebar-link {
  display: block;
  padding: 10px 15px;
  color: var(--logo-brown);
  text-decoration: none;
  font-weight: 500;
}
.sidebar-link:hover {
  background-color: var(--logo-beige);
  border-radius: 6px;
}
</style>
