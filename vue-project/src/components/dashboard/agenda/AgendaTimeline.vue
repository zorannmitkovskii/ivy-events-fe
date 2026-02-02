<template>
  <div class="card card-pad-lg" style="background: rgba(255,255,255,0.55);">
    <div class="row" style="margin-bottom:10px;">
      <div style="font-weight:900;">{{ dateLabel }}</div>
      <span class="pill" style="background: rgba(0,0,0,0.03);">
        {{ t("agenda.totalDuration") }}: {{ totalDuration }}
      </span>
    </div>

    <div class="timeline">
      <div v-if="showNow" class="now">{{ nowLabel }}</div>

      <AgendaItemCard
        v-for="it in items"
        :key="it.id"
        :item="it"
        @select="$emit('select', $event)"
      />
    </div>

    <div class="card" style="margin-top:14px; padding:16px; box-shadow:none; background:rgba(255,255,255,0.6); border-style:dashed;">
      <div class="small" style="text-align:center;">＋ {{ t("agenda.addItem") }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import AgendaItemCard from "./AgendaItemCard.vue";
const { t } = useI18n();

const props = defineProps({
  items: { type: Array, default: () => [] },
  date: { type: String, default: "" }
});
defineEmits(["select"]);

const dateLabel = computed(() => props.date || "");
const showNow = computed(() => props.items.some((x) => x.status === "in_progress"));
const nowLabel = computed(() => t("agenda.now"));

const totalDuration = computed(() => {
  // naive: sum durations in minutes (HH:mm)
  const toMin = (hhmm) => {
    const [h, m] = String(hhmm || "0:0").split(":").map(Number);
    return h * 60 + m;
  };
  let total = 0;
  props.items.forEach((x) => total += Math.max(0, toMin(x.end) - toMin(x.start)));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${m}m`;
});
</script>

<style scoped>
.timeline { display:grid; gap:12px; }
.now{
  color: var(--brand-gold);
  font-size:12px;
  font-weight:900;
}
</style>
