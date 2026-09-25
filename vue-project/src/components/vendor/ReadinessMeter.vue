<template>
  <div class="readiness">
    <div class="score">
      <strong>{{ readiness.percent }}%</strong>
      <span :class="['pill', approvalStatus === 'APPROVED' ? 'green' : 'amber']">
        {{ t(`vendorWork.approval.${approvalStatus || 'DRAFT'}`) }}
      </span>
    </div>
    <div class="bar" role="progressbar" :aria-valuenow="readiness.percent" aria-valuemin="0" aria-valuemax="100">
      <span :style="{ width: `${readiness.percent}%` }"></span>
    </div>
    <ul class="lines">
      <li v-for="step in readiness.steps" :key="step.step" class="line">
        <div>
          <b>{{ t(`vendorWork.readiness.step.${step.step}`) }}</b>
          <small>{{ step.done ? t(`vendorWork.readiness.done.${step.step}`) : t(`vendorWork.readiness.todo.${step.step}`) }}</small>
        </div>
        <span :class="step.done ? 'ok' : 'todo'" aria-hidden="true">{{ step.done ? '✓' : '→' }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
/**
 * How complete the vendor's public profile is, and what is still missing.
 * The home and the profile page show the same meter from the same numbers.
 */
import { useI18n } from 'vue-i18n'

defineProps({
  readiness: { type: Object, required: true },
  approvalStatus: { type: String, default: '' },
})

const { t } = useI18n()
</script>

<style scoped src="../agency/agency-panels.css"></style>

<style scoped>
.score {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score strong {
  font-family: var(--display);
  font-size: 28px;
  font-weight: 400;
  color: var(--ivy);
}

.bar {
  height: 8px;
  margin: 10px 0;
  border-radius: 8px;
  background: var(--mist);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  border-radius: 8px;
  background: var(--moss);
}

.ok {
  color: var(--moss);
  font-weight: 700;
}

.todo {
  color: var(--ink-3);
}
</style>
