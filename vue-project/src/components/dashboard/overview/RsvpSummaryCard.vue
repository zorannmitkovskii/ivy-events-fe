<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">{{ t("overview.rsvpSummary") }}</div>
      <router-link :to="guestsLink" class="card-action">{{ t("overview.viewDetails") }} &rarr;</router-link>
    </div>

    <div class="rsvp-layout" style="margin-top:14px;">
      <div class="donut-wrap">
        <canvas ref="donutCanvas" width="140" height="140"></canvas>
        <div class="donut-center">
          <div class="donut-center-num">{{ rsvp.total }}</div>
          <div class="donut-center-lbl">{{ t("overview.total") }}</div>
        </div>
      </div>

      <div class="rsvp-legend">
        <div v-for="item in legendItems" :key="item.label" class="legend-item">
          <div class="legend-left">
            <div class="legend-color" :style="{ background: item.color }"></div>
            <div class="legend-name">{{ item.label }}</div>
          </div>
          <div class="legend-right">
            <div class="legend-count">{{ item.value }}</div>
            <div class="legend-pct">{{ item.pct }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
const lang = computed(() => route.params.lang || "mk");
const guestsLink = computed(() => `/${lang.value}/dashboard/events/guests`);

const props = defineProps({ rsvp: Object });

const donutCanvas = ref(null);

const legendItems = computed(() => {
  const total = props.rsvp?.total || 1;
  return [
    { label: t("overview.coming"), value: props.rsvp?.comming || 0, color: "#5a7a52", pct: Math.round(((props.rsvp?.comming || 0) / total) * 100) },
    { label: t("overview.maybe"), value: props.rsvp?.maybe || 0, color: "#b8954e", pct: Math.round(((props.rsvp?.maybe || 0) / total) * 100) },
    { label: t("overview.declined"), value: props.rsvp?.decline || 0, color: "#c4968e", pct: Math.round(((props.rsvp?.decline || 0) / total) * 100) },
    { label: t("overview.waiting"), value: props.rsvp?.waiting || 0, color: "#e6dfd4", pct: Math.round(((props.rsvp?.waiting || 0) / total) * 100) },
  ];
});

function drawDonut() {
  const canvas = donutCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = 140;
  const center = size / 2;
  const outerR = 66;
  const innerR = 46;
  const total = props.rsvp?.total || 1;
  const data = [
    { val: props.rsvp?.comming || 0, color: "#5a7a52" },
    { val: props.rsvp?.maybe || 0, color: "#b8954e" },
    { val: props.rsvp?.decline || 0, color: "#c4968e" },
    { val: props.rsvp?.waiting || 0, color: "#e6dfd4" },
  ];

  ctx.clearRect(0, 0, size, size);
  let startAngle = -Math.PI / 2;

  data.forEach(seg => {
    if (seg.val <= 0) return;
    const sliceAngle = (seg.val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(center, center, outerR, startAngle, startAngle + sliceAngle);
    ctx.arc(center, center, innerR, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    startAngle += sliceAngle;
  });
}

onMounted(drawDonut);
watch(() => props.rsvp, drawDonut, { deep: true });
</script>
