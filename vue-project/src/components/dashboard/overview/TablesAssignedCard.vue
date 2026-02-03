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
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = defineProps({ assigned: Number, total: Number });
const percent = computed(() => {
  if (!props.total) return 0;
  return Math.round((props.assigned / props.total) * 100);
});
</script>
