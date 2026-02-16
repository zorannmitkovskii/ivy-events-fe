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
  border: 2px solid var(--neutral-300);
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.item:hover{
  box-shadow: var(--shadow-sm);
}
.selected{
  background: var(--bg-main);
  border-color: var(--brand-gold);
  box-shadow: 0 4px 16px rgba(200,162,77,0.12);
}
.top{ display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
.name{ font-weight: 600; font-size: 15px; color: var(--brand-main); }
.tag{
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  background: var(--brand-gold);
  color: var(--brand-main);
  white-space: nowrap;
}
.meta{ font-size: 13px; color: var(--neutral-500); }
.progress{ display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.bar{ flex: 1; height: 8px; background: var(--neutral-300); border-radius: 999px; overflow: hidden; }
.fill{ height: 100%; background: var(--brand-gold); border-radius: 999px; transition: width 0.3s ease; }
.count{ font-size: 12px; color: var(--neutral-500); font-weight: 600; white-space: nowrap; }
</style>
