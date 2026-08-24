<template>
  <figure class="viz">
    <figcaption>
      <h2>{{ t('adminOverview.rsvpChart') }}</h2>
      <span v-if="total" class="centre">{{ rateLabel }}</span>
    </figcaption>

    <div v-if="!total" class="empty">{{ t('adminOverview.rsvpChartEmpty') }}</div>

    <template v-else>
      <div class="canvas-wrap">
        <canvas ref="canvas" :aria-label="summary" role="img"></canvas>
      </div>

      <!--
        The legend carries the numbers, not just the hues. It is also the relief
        the palette check requires: the aqua slice sits under 3:1 on a light
        surface, so the value must be readable without seeing the colour.
      -->
      <ul class="legend">
        <li v-for="slice in slices" :key="slice.key">
          <span class="swatch" :style="{ background: slice.color }" aria-hidden="true"></span>
          <span class="name">{{ slice.label }}</span>
          <span class="value">{{ slice.value }}</span>
        </li>
      </ul>
    </template>
  </figure>
</template>

<script setup>
/**
 * Where the invitations stand (IVY-1202).
 *
 * <p>Three parts of one whole: answered yes, answered no, and asked but silent.
 * Guests who were never invited are not here — they are not part of the
 * question, and including them would quietly redefine the rate the card above
 * reports.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart, ArcElement, DoughnutController, Tooltip } from 'chart.js'
import { vizPalette } from '@/utils/vizPalette'

Chart.register(ArcElement, DoughnutController, Tooltip)

const props = defineProps({
  confirmed: { type: Number, default: 0 },
  responded: { type: Number, default: 0 },
  invited: { type: Number, default: 0 },
  rate: { type: Number, default: null },
})

const { t } = useI18n()
const canvas = ref(null)
let chart = null

const declined = computed(() => Math.max(props.responded - props.confirmed, 0))
const total = computed(() => props.confirmed + declined.value + props.invited)

const slices = computed(() => {
  const palette = vizPalette()
  return [
    { key: 'confirmed', label: t('adminOverview.confirmed'), value: props.confirmed, color: palette.series[0] },
    { key: 'declined', label: t('adminOverview.declined'), value: declined.value, color: palette.series[1] },
    { key: 'awaiting', label: t('adminOverview.awaiting'), value: props.invited, color: palette.series[2] },
  ]
})

const rateLabel = computed(() =>
  props.rate === null || props.rate === undefined ? '—' : `${props.rate}%`
)

/** Read by a screen reader instead of the canvas, which says nothing. */
const summary = computed(() =>
  slices.value.map((slice) => `${slice.label}: ${slice.value}`).join(', ')
)

function render() {
  if (!canvas.value || !total.value) return
  chart?.destroy()

  chart = new Chart(canvas.value, {
    type: 'doughnut',
    data: {
      labels: slices.value.map((slice) => slice.label),
      datasets: [{
        data: slices.value.map((slice) => slice.value),
        backgroundColor: slices.value.map((slice) => slice.color),
        // A surface-coloured gap so touching arcs stay separable, including
        // for a reader who cannot tell the two hues apart.
        borderColor: vizPalette().surface,
        borderWidth: 2,
      }],
    },
    options: {
      cutout: '68%',
      responsive: true,
      maintainAspectRatio: false,
      // The legend below carries identity and the values; a second one here
      // would repeat it in a smaller, less readable form.
      plugins: { legend: { display: false } },
    },
  })
}

onMounted(render)
watch(slices, render, { deep: true })
onBeforeUnmount(() => chart?.destroy())
</script>

<style scoped>
.viz {
  margin: 0;
  /* A grid item defaults to min-width:auto, and a canvas has an intrinsic
     width — without this the chart pushes the page sideways on a phone. */
  min-width: 0;
  background: var(--cards-color, #fff);
  border: 1px solid var(--border-color, #e6e5e1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

figcaption {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

figcaption h2 {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #52514e);
}

.centre {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-color, #0b0b0b);
  font-family: ui-sans-serif, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.canvas-wrap {
  position: relative;
  height: 150px;
}

.empty {
  color: var(--text-muted, #52514e);
  font-size: 0.88rem;
  padding: 24px 0;
}

.legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex: none;
}

.name {
  color: var(--text-muted, #52514e);
}

.value {
  margin-left: auto;
  font-weight: 600;
  color: var(--text-color, #0b0b0b);
  font-family: ui-sans-serif, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}
canvas {
  max-width: 100%;
}
</style>
