<template>
  <div class="card card-pad-lg">
    <div class="row" style="justify-content:space-between;">
      <div style="font-weight:900;">{{ t("overview.rsvpSummary") }}</div>
      <a class="kpi-sub" style="text-decoration:none; font-weight:800; cursor:pointer;">
        {{ t("overview.viewDetails") }}
      </a>
    </div>

    <div class="donut-wrap">
      <div class="donut" :style="{ background: donutBg }"></div>
      <div class="donut-center">
        <div class="big">{{ rsvp.invited }}</div>
        <div class="kpi-sub">{{ t("overview.invited") }}</div>
      </div>
    </div>

    <div class="mini">
      <div class="box">
        <div class="num">{{ rsvp.attending }}</div>
        <div class="kpi-sub">{{ t("overview.attending") }}</div>
      </div>
      <div class="box">
        <div class="num">{{ rsvp.declined }}</div>
        <div class="kpi-sub">{{ t("overview.declined") }}</div>
      </div>
      <div class="box">
        <div class="num">{{ rsvp.pending }}</div>
        <div class="kpi-sub">{{ t("overview.pending") }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = defineProps({ rsvp: Object });

const donutBg = computed(() => {
  const total = props.rsvp?.invited || 1;
  const attending = props.rsvp?.attending || 0;
  const declined = props.rsvp?.declined || 0;

  const a = Math.round((attending / total) * 360);
  const d = Math.round((declined / total) * 360);
  const p = Math.max(0, 360 - a - d);

  // match design: dark green + sage + light grey
  return `conic-gradient(#2f3e36 0 ${a}deg, #bfd2a4 ${a}deg ${a + d}deg, #e7e7e7 ${a + d}deg ${a + d + p}deg)`;
});
</script>

<style scoped>
.donut-wrap{
  position: relative;
  height: 230px;
  display: grid;
  place-items: center;
  margin-top: 12px;
}
.donut{
  width: 190px;
  height: 190px;
  border-radius: 999px;
  position: relative;
}
.donut::after{
  content:"";
  position:absolute;
  inset: 22px;
  background: rgba(255,255,255,0.95);
  border-radius: 999px;
}
.donut-center{
  position:absolute;
  display: grid;
  place-items: center;
  text-align: center;
}
.big{ font-size: 28px; font-weight: 950; color: var(--neutral-900); }
.mini{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 12px;
}
.box{
  background: rgba(0,0,0,0.02);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 10px 12px;
  text-align: center;
}
.num{ font-weight: 950; font-size: 16px; }
</style>
