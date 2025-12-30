<template>
  <div class="chart-box bg-white p-4 rounded shadow-sm">
    <h5 class="text-brand-dark mb-3">{{ title }}</h5>
    <canvas ref="chartEl"></canvas>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'


const props = defineProps(['title', 'data'])
const chartEl = ref(null)


onMounted(() => {
  new Chart(chartEl.value, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ data: [12, 19, 3], backgroundColor: '#8C623C' }]
    }
  })
})
</script>


<style scoped>
.chart-box {
  min-height: 300px;
}
</style>
