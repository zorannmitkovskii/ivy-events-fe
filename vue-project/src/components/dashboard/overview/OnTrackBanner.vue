<template>
  <div class="ov-banner">
    <div class="bicon">🔔</div>

    <div>
      <div style="font-weight:950; font-size:16px;">{{ t("overview.onTrackTitle") }}</div>
      <div class="kpi-sub" style="color: rgba(255,255,255,0.85); margin-top:4px;">
        {{ message }}
      </div>
    </div>

    <button class="btn-gold">{{ t("overview.viewTimeline") }}</button>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
defineProps({ percent: Number, message: String });
const { t } = useI18n();
</script>
