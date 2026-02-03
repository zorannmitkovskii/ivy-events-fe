<template>
  <div class="item" :class="{ muted: item.status === 'completed' }">
    <div class="time">{{ item.start }} - {{ item.end }}</div>

    <div class="box" :class="{ highlight: item.status === 'in_progress' }" @click="$emit('select', item)">
      <span class="pill" :style="pillStyle">{{ statusLabel }}</span>

      <div class="title" :style="item.status === 'in_progress' ? 'font-family: var(--font-family); font-size:26px;' : ''">
        {{ item.title }}
      </div>

      <div v-if="item.notes" class="small" style="margin-top:8px; max-width:520px;">
        {{ item.notes }}
      </div>

      <div class="chips">
        <span v-if="item.location" class="pill" style="background:rgba(0,0,0,0.03);">📍 {{ item.location }}</span>
        <span v-if="item.responsible" class="pill" style="background:rgba(0,0,0,0.03);">👤 {{ item.responsible }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = defineProps({ item: Object });

const statusLabel = computed(() => {
  switch (props.item.status) {
    case "completed": return t("agenda.statusCompleted");
    case "in_progress": return t("agenda.statusInProgress");
    case "break": return t("agenda.statusBreak");
    default: return t("agenda.statusUpcoming");
  }
});

const pillStyle = computed(() => {
  if (props.item.status === "in_progress") return { background: "#FFF2D6" };
  if (props.item.status === "completed") return { background: "rgba(0,0,0,0.03)" };
  if (props.item.status === "break") return { background: "rgba(0,0,0,0.03)" };
  return { background: "rgba(0,0,0,0.03)" };
});

defineEmits(["select"]);
</script>

<style scoped>
.item { display:grid; grid-template-columns: 120px 1fr; gap:14px; align-items:start; }
.time { color: var(--neutral-700); font-size:12px; padding-top:12px; }
.box{
  background: rgba(255,255,255,0.75);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  padding: 14px;
  cursor: pointer;
}
.box.highlight{
  border-left: 4px solid var(--brand-gold);
  box-shadow: var(--shadow-sm);
}
.title{ font-weight:900; font-size:18px; margin-top:8px; }
.chips{ display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
.muted .box { opacity: 0.65; }
@media (max-width: 1100px){
  .item { grid-template-columns: 1fr; }
}
</style>
