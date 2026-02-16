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
        <div class="big">{{ rsvp.total }}</div>
        <div class="kpi-sub">{{ t("overview.total") }}</div>
      </div>
    </div>

    <div class="mini">
      <div class="box">
        <div class="num">{{ rsvp.comming }}</div>
        <div class="kpi-sub">{{ t("overview.coming") }}</div>
      </div>
      <div class="box">
        <div class="num">{{ rsvp.maybe }}</div>
        <div class="kpi-sub">{{ t("overview.maybe") }}</div>
      </div>
      <div class="box">
        <div class="num">{{ rsvp.decline }}</div>
        <div class="kpi-sub">{{ t("overview.declined") }}</div>
      </div>
      <div class="box">
        <div class="num">{{ rsvp.waiting }}</div>
        <div class="kpi-sub">{{ t("overview.waiting") }}</div>
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
  const total = props.rsvp?.total || 1;
  const comming = props.rsvp?.comming || 0;
  const maybe = props.rsvp?.maybe || 0;
  const decline = props.rsvp?.decline || 0;

  const a1 = Math.round((comming / total) * 360);
  const a2 = a1 + Math.round((maybe / total) * 360);
  const a3 = a2 + Math.round((decline / total) * 360);

  return `conic-gradient(#2f3e36 0deg ${a1}deg, #C8A24D ${a1}deg ${a2}deg, #c27c7c ${a2}deg ${a3}deg, #e7e7e7 ${a3}deg 360deg)`;
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
  grid-template-columns: repeat(4, 1fr);
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
