<template>
  <div class="ov-banner">
    <div class="bicon">🔔</div>

    <div>
      <div style="font-weight:950; font-size:16px;">{{ t("overview.onTrackTitle") }}</div>
      <div class="kpi-sub" style="color: rgba(255,255,255,0.85); margin-top:4px;">
        {{ message }}
      </div>
    </div>

    <ButtonMain variant="gold">{{ t("overview.viewTimeline") }}</ButtonMain>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import ButtonMain from "@/components/generic/ButtonMain.vue";
defineProps({ percent: Number, message: String });
const { t } = useI18n();
</script>
