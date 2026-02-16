<template>
  <section class="timeline">
    <div class="head">
      <h2 class="day">{{ dayTitle }}</h2>
      <div class="total">{{ totalLabel }}</div>
    </div>

    <div class="body">
      <div class="rail" aria-hidden="true">
        <div class="rail-line"></div>
      </div>

      <div class="items">
        <AgendaItemCard
          v-for="it in items"
          :key="it.id || it._key"
          :time="formatRange(it.startTime, it.endTime)"
          :title="it.title"
          :notes="it.notes"
          :location="it.location"
          :responsible="it.responsible"
          :status="it.status"
          :tag="it.tag"
          :selected="selectedId === it.id"
          @select="$emit('select', it)"
        />
        <div v-if="!items?.length" class="empty">
          No agenda items yet.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import AgendaItemCard from "@/components/dashboard/agenda/AgendaItemCard.vue";

defineProps({
  dayTitle: { type: String, required: true },
  totalLabel: { type: String, required: true },
  items: { type: Array, required: true },
  selectedId: { type: String, default: "" }
});

defineEmits(["select"]);

function formatRange(start, end) {
  if (!start && !end) return "";
  if (start && !end) return start;
  if (!start && end) return end;
  return `${start} – ${end}`;
}
</script>

<style scoped>
.timeline {
  padding: 22px 26px;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 10px;
}

.day {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: #2b2a27;
}

.total {
  font-size: 12px;
  font-weight: 800;
  color: #6e6a5f;
  background: #fff;
  border: 1px solid #ece7d8;
  padding: 6px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.body {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 14px;
  align-items: start;
}

.rail {
  display: flex;
  justify-content: center;
}

.rail-line {
  width: 2px;
  border-radius: 999px;
  background: #d7d2c2;
  height: 100%;
  min-height: 60px;
}

.items {
  display: grid;
  gap: 14px;
}

.empty {
  padding: 16px;
  border: 1px dashed #ddd6c1;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.6);
  color: #6e6a5f;
  font-weight: 700;
}
</style>
