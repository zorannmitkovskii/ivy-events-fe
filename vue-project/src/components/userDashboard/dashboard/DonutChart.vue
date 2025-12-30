<template>
  <div class="chart-card">
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h6 class="mb-0 text-brand-dark">{{ title }}</h6>
      <div class="chart-legend" v-if="legendLabels?.length">
        <div v-for="(l,i) in legendLabels" :key="i" class="legend-item">
          <span class="legend-swatch" :style="{ background: computedColors[i] }"></span>
          <small>{{ l }}</small>
        </div>
      </div>
    </div>

    <div style="display:flex; justify-content:center; align-items:center;">
      <canvas ref="canvas" style="max-width:420px; width:100%; height:260px;"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js'
Chart.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  title: { type: String, default: '' },
  labels: { type: Array, required: true },
  values: { type: Array, required: true },
  colors: { type: Array, default: null } // optional
})

const canvas = ref(null)
let chart = null

const computedColors = props.colors && props.colors.length
  ? props.colors
  : [
    '#8C623C', // brown
    '#F0E6DA', // beige
    '#C09B72',
    '#A67C52',
    '#EEDFCC'
  ]

const legendLabels = props.labels

function buildChart(){
  if(chart) chart.destroy()
  chart = new Chart(canvas.value.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: props.labels,
      datasets: [{
        data: props.values,
        backgroundColor: computedColors.slice(0, props.values.length),
        borderWidth: 0
      }]
    },
    options: {
      cutout: '70%',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {} }
      }
    }
  })
}

onMounted(buildChart)
onUnmounted(()=> chart?.destroy())

watch(()=> [props.values, props.labels], () => buildChart())
</script>

<style scoped>
</style>
