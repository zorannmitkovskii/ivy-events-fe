<template>
  <figure class="viz">
    <figcaption>
      <h2>{{ t('adminOverview.monthlyChart') }}</h2>
      <InfoHint :text="t('adminOverview.monthlyHint')" :label="t('adminOverview.monthlyChart')" />
    </figcaption>

    <div v-if="!hasAny" class="empty">{{ t('adminOverview.monthlyEmpty') }}</div>

    <div v-else class="canvas-wrap">
      <canvas ref="canvas" :aria-label="summary" role="img"></canvas>
    </div>
  </figure>
</template>

<script setup>
/**
 * Events per month (IVY-1202).
 *
 * <p>One series, so no legend — the caption names it. Months with nothing in
 * them are drawn as gaps rather than skipped: three events across six months
 * and three across three are different facts, and a chart that closes the gaps
 * shows them as the same one.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js'
import InfoHint from '@/components/dashboard/InfoHint.vue'
import { vizPalette } from '@/utils/vizPalette'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)

const props = defineProps({
  /** `[{ month: '2026-08', count: 4 }]`, already gap-filled by the server. */
  points: { type: Array, default: () => [] },
})

const { t } = useI18n()
const canvas = ref(null)
let chart = null

const hasAny = computed(() => props.points.some((point) => point.count > 0))

const labels = computed(() => props.points.map((point) => shortMonth(point.month)))

const summary = computed(() =>
  props.points.map((point) => `${point.month}: ${point.count}`).join(', ')
)

/**
 * `2026-08` → `авг`, from our own translations (IVY-1204).
 *
 * <p>This used to be `toLocaleDateString(undefined, …)`, which asked for the
 * browser's locale rather than the page's and labelled a Macedonian dashboard
 * Jun Jul Aug. Passing the app's locale is the obvious fix and it is not
 * enough: **a browser that has no Macedonian data silently answers in
 * English.** Chromium's own test build is one — `supportedLocalesOf(['mk'])`
 * comes back empty there — so the chart would keep lying on exactly the
 * machines nobody checks.
 *
 * <p>Twelve words per language cost less than depending on somebody else's
 * ICU build.
 */
function shortMonth(iso) {
  const [year, month] = String(iso).split('-').map(Number)
  if (!year || !month || month < 1 || month > 12) return iso
  return t(`months.short[${month - 1}]`)
}

function render() {
  if (!canvas.value || !hasAny.value) return
  chart?.destroy()
  const palette = vizPalette()

  chart = new Chart(canvas.value, {
    type: 'bar',
    data: {
      labels: labels.value,
      datasets: [{
        data: props.points.map((point) => point.count),
        backgroundColor: palette.series[0],
        borderRadius: 4,
        // Thin marks; the bars are data, not decoration.
        maxBarThickness: 26,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          border: { color: palette.grid },
          ticks: { color: palette.muted, font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          // A count axis with fractional ticks reads as though half an event
          // is a thing that can happen.
          ticks: { color: palette.muted, font: { size: 11 }, precision: 0 },
          grid: { color: palette.grid, drawTicks: false },
          border: { display: false },
        },
      },
    },
  })
}

onMounted(render)
watch(() => props.points, render, { deep: true })
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
  align-items: center;
  gap: 6px;
}

figcaption h2 {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #52514e);
}

.canvas-wrap {
  position: relative;
  height: 200px;
}

.empty {
  color: var(--text-muted, #52514e);
  font-size: 0.88rem;
  padding: 24px 0;
}
canvas {
  max-width: 100%;
}
</style>
