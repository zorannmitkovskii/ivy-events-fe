<template>
  <div class="card card-pad-lg">
    <div class="card-head">
      <div class="card-label">{{ t("overview.tablesAssigned") }}</div>
      <div class="card-icon">▦</div>
    </div>

    <div class="kpi">{{ assigned }}<span class="kpi-sub">/{{ total }}</span></div>

    <div style="margin-top:14px;">
      <div class="track">
        <div class="fill" :style="{ width: percent + '%' }"></div>
      </div>
      <div class="kpi-sub" style="margin-top:10px;">
        {{ percent }}% {{ t("overview.tablesSeated") }}
      </div>
    </div>

    <div class="guest-section">
      <div class="kpi-sub section-label">{{ t("overview.guestAssignment") }}</div>
      <div class="track">
        <div class="fill fill-guest" :style="{ width: guestPercent + '%' }"></div>
      </div>
      <div class="kpi-sub" style="margin-top:6px;">
        {{ assignedGuests }}/{{ totalGuests }} {{ t("overview.guestsAssigned") }}
        ({{ guestPercent }}%)
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = defineProps({
  assigned: Number,
  total: Number,
  assignedGuests: { type: Number, default: 0 },
  totalGuests: { type: Number, default: 0 }
});

const percent = computed(() => {
  if (!props.total) return 0;
  return Math.round((props.assigned / props.total) * 100);
});

const guestPercent = computed(() => {
  if (!props.totalGuests) return 0;
  return Math.round((props.assignedGuests / props.totalGuests) * 100);
});
</script>

<style scoped>
.guest-section {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.section-label {
  font-weight: 800;
  margin-bottom: 8px;
}
.fill-guest {
  background: var(--brand-main);
}
</style>
