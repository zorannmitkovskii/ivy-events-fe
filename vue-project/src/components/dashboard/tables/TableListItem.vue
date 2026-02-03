<template>
  <button class="item" :class="{ selected }" @click="$emit('select')">
    <div class="top">
      <div class="name">{{ table.name }}</div>
      <span v-if="selected" class="tag">{{ t("tables.selected") }}</span>
    </div>

    <div class="meta">
      {{ t("tables.capacity") }}: {{ table.capacity }} {{ t("tables.guests") }}
    </div>

    <div class="bar">
      <div class="fill" :style="{ width: pct + '%' }"></div>
    </div>

    <div class="count">{{ table.assigned }}/{{ table.capacity }}</div>
  </button>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = defineProps({
  table: Object,
  selected: Boolean
});
defineEmits(["select"]);

const pct = computed(() => {
  if (!props.table?.capacity) return 0;
  return Math.min(100, Math.round((props.table.assigned / props.table.capacity) * 100));
});
</script>

<style scoped>
.item{
  width: 100%;
  text-align: left;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.72);
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;
}
.item:hover{ background: rgba(255,255,255,0.90); }
.selected{
  border-color: rgba(200,162,77,0.55);
  box-shadow: 0 10px 24px rgba(200,162,77,0.10);
}
.top{ display:flex; justify-content:space-between; align-items:center; gap:10px; }
.name{ font-weight: 950; }
.tag{
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 900;
  background: rgba(200,162,77,0.24);
  color: #5a4410;
}
.meta{ margin-top: 6px; font-size: 12px; color: var(--neutral-700); }
.bar{ margin-top: 10px; height: 6px; background: rgba(0,0,0,0.06); border-radius: 999px; overflow:hidden; }
.fill{ height:100%; background: var(--brand-gold); border-radius: 999px; }
.count{ margin-top: 8px; font-size: 12px; color: var(--neutral-700); text-align:right; font-weight: 800; }
</style>
