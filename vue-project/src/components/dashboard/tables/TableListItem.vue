<template>
  <button class="item" :class="{ selected }" @click="$emit('select')">
    <div class="top">
      <div class="name">{{ table.name }}</div>
      <span v-if="selected" class="tag">{{ t("tables.selected") }}</span>
    </div>

    <template v-if="isUnassigned">
      <div class="meta">{{ table.assigned }} {{ t("tables.guests") }}</div>
    </template>

    <template v-else>
      <div class="meta">
        {{ t("tables.capacity") }}: {{ table.capacity }} {{ t("tables.guests") }}
      </div>

      <div class="progress">
        <div class="bar">
          <div class="fill" :style="{ width: pct + '%' }"></div>
        </div>
        <span class="count">{{ table.assigned }}/{{ table.capacity }}</span>
      </div>
    </template>
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

const isUnassigned = computed(() => props.table?.id === "unassigned");

const pct = computed(() => {
  if (!props.table?.capacity) return 0;
  return Math.min(100, Math.round((props.table.assigned / props.table.capacity) * 100));
});
</script>

<style scoped>
.item{
  width: 100%;
  text-align: left;
  border: 1.5px solid var(--dash-cream-border);
  background: var(--dash-cream-card);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.item:hover{
  border-color: var(--dash-sage-pale);
  box-shadow: var(--dash-shadow-sm);
}
.selected{
  background: var(--dash-cream);
  border-color: var(--dash-gold);
  box-shadow: 0 4px 16px rgba(184,149,78,0.12);
}
.top{ display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; }
.name{ font-weight: 600; font-size: 13.5px; color: var(--dash-ink); }
.tag{
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: var(--dash-gold-pale);
  color: var(--dash-gold);
  white-space: nowrap;
}
.meta{ font-size: 12px; color: var(--dash-muted); }
.progress{ display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.bar{ flex: 1; height: 6px; background: var(--dash-sage-ghost); border-radius: 999px; overflow: hidden; }
.fill{ height: 100%; background: linear-gradient(90deg, var(--dash-sage-light), var(--dash-sage)); border-radius: 999px; transition: width 0.4s ease; }
.count{ font-size: 11px; color: var(--dash-muted); font-weight: 600; white-space: nowrap; }
</style>
