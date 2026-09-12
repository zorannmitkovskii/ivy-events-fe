<template>
  <section ref="root" class="statement section" aria-labelledby="stmt-title">
    <div class="wrap">
      <h2 id="stmt-title">{{ $t('home.statement.title') }}</h2>

      <div class="stats-panel">
        <div v-for="stat in STATS" :key="stat.key">
          <b><span class="cnt">{{ shown(stat) }}</span></b>
          <span>{{ $t(`home.statement.stats.${stat.key}.label`) }}</span>
          <small>{{ $t(`home.statement.stats.${stat.key}.note`) }}</small>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

/*
  The claim, and the three numbers under it.

  The figures count up once, the first time the panel is scrolled into view —
  not on mount, which would run the animation while the section is still two
  screens below and leave a static number by the time anyone arrives.
*/

const COUNT_MS = 1100
const VISIBLE_FRACTION = 0.5

const STATS = [
  { key: 'cost', to: 50, prefix: '−', suffix: '%' },
  { key: 'planning', to: 100, prefix: '', suffix: '%' },
  { key: 'hours', to: 24, prefix: '', suffix: '+' },
]

const root = ref(null)
const values = ref(Object.fromEntries(STATS.map((s) => [s.key, 0])))
const done = ref(false)

/** The final figure until the animation runs, so a reader who never triggers
 *  it — reduced motion, no IntersectionObserver — still sees the number. */
function shown(stat) {
  const value = done.value ? values.value[stat.key] : stat.to
  return `${stat.prefix}${value}${stat.suffix}`
}

let observer = null

function countUp() {
  if (done.value) return
  done.value = true
  const start = performance.now()

  const tick = (now) => {
    const progress = Math.min((now - start) / COUNT_MS, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    values.value = Object.fromEntries(STATS.map((s) => [s.key, Math.round(s.to * eased)]))
    if (progress < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

onMounted(() => {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced || !('IntersectionObserver' in window) || !root.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      observer.disconnect()
      countUp()
    },
    { threshold: VISIBLE_FRACTION },
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>
