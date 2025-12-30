<template>
  <div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>


<script setup>
import { onMounted, ref, onUnmounted } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)


const chartCanvas = ref(null)
let chartInstance = null


function createChart(ctx) {
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul']
  const planned = [20000, 25000, 22000, 30000, 28000, 32000, 35000]
  const spent = [15000, 18000, 20000, 24000, 23000, 26000, 30000]


  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Planned',
          data: planned,
          backgroundColor: 'rgba(140,98,60,0.8)'
        },
        {
          type: 'line',
          label: 'Spent',
          data: spent,
          borderColor: 'rgba(47,82,51,1)',
          tension: 0.3,
          fill: false,
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { beginAtZero: true }
      }
    }
  })
}


onMounted(() => createChart(chartCanvas.value))
onUnmounted(() => { if (chartInstance) chartInstance.destroy() })
</script>


<style scoped>
canvas { max-height: 320px; }
</style>
