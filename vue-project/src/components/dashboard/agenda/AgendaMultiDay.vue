<template>
  <section class="multi">
    <div class="tabs">
      <button
        v-for="d in days"
        :key="d.id"
        class="tab"
        :class="{ active: d.id === activeDayId }"
        type="button"
        @click="$emit('update:activeDayId', d.id)"
      >
        <div class="tab-top">{{ d.labelTop }}</div>
        <div class="tab-bottom">{{ d.labelBottom }}</div>
      </button>

      <button class="tab add" type="button" @click="$emit('addDay')">
        + Add Day
      </button>
    </div>

    <AgendaTimeline
      :dayTitle="activeDayTitle"
      :totalLabel="totalLabel"
      :items="activeItems"
      :selectedId="selectedId"
      @select="$emit('select', $event)"
    />
  </section>
</template>

<script setup>
import { computed } from "vue";
import AgendaTimeline from "@/components/dashboard/agenda/AgendaTimeline.vue";

const props = defineProps({
  days: { type: Array, required: true },         // [{id,labelTop,labelBottom,title}]
  itemsByDay: { type: Object, required: true },  // { [dayId]: items[] }
  activeDayId: { type: String, required: true },
  totalLabel: { type: String, required: true },
  selectedId: { type: String, default: "" }
});

defineEmits(["update:activeDayId", "addDay", "select"]);

const activeItems = computed(() => props.itemsByDay[props.activeDayId] ?? []);

const activeDayTitle = computed(() => {
  const d = props.days.find(x => x.id === props.activeDayId);
  return d?.title ?? "";
});
</script>

<style scoped>
.multi {
  padding-top: 10px;
}

.tabs {
  display: flex;
  gap: 10px;
  padding: 0 26px;
  flex-wrap: wrap;
}

.tab {
  background: #fff;
  border: 1px solid #ece7d8;
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  min-width: 130px;
  text-align: left;
  transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
}

.tab.active {
  background: #2f3e36;
  border-color: #2f3e36;
  color: #fff;
}

.tab-top {
  font-size: 12px;
  font-weight: 900;
}

.tab-bottom {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}

.tab.add {
  background: transparent;
  border: 1px dashed #d7d2c2;
  color: #3a362f;
  font-weight: 900;
}
</style>
