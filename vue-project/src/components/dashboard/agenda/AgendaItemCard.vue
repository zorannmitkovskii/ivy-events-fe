<!-- src/components/agenda/AgendaItemCard.vue -->
<template>
  <article class="card" :class="{ selected }" @click="$emit('select')">
    <div class="top">
      <div class="time">{{ time }}</div>

      <div v-if="status" class="status">
        {{ statusText }}
      </div>

      <button
        class="more"
        type="button"
        @click.stop="$emit('select')"
        aria-label="Edit"
        title="Edit"
      >
        ⋯
      </button>
    </div>

    <h3 class="title">{{ title }}</h3>

    <p v-if="notes" class="notes">
      {{ notes }}
    </p>

    <div class="meta">
      <span v-if="location" class="pill">📍 {{ location }}</span>
      <span v-if="responsible" class="pill">👤 {{ responsible }}</span>
      <span v-if="tag" class="tag">{{ tag }}</span>
    </div>
  </article>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  time: { type: String, default: "" },
  title: { type: String, required: true },
  notes: { type: String, default: "" },
  location: { type: String, default: "" },
  responsible: { type: String, default: "" },
  status: { type: String, default: "" }, // UPCOMING | IN_PROGRESS | COMPLETED | ...
  tag: { type: String, default: "" },
  selected: { type: Boolean, default: false }
});

defineEmits(["select"]);

const statusText = computed(() => {
  // Keep it simple; if you want i18n later, map with t()
  switch (props.status) {
    case "UPCOMING":
      return "Upcoming";
    case "IN_PROGRESS":
      return "In progress";
    case "COMPLETED":
      return "Completed";
    default:
      return props.status;
  }
});
</script>

<style scoped>
.card {
  background: #fff;
  border: 1px solid #ece7d8;
  border-radius: 14px;
  padding: 14px 14px 12px;
  cursor: pointer;
  transition: box-shadow 120ms ease, border-color 120ms ease, transform 120ms ease;
}

.card:hover {
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.card.selected {
  border-color: #c8a24d;
  box-shadow: 0 10px 22px rgba(200, 162, 77, 0.12);
}

.top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time {
  font-weight: 900;
  font-size: 12px;
  color: #2b2a27;
  letter-spacing: 0.02em;
}

.status {
  font-size: 12px;
  font-weight: 900;
  color: #2f3e36;
  background: #eaf0ea;
  padding: 4px 8px;
  border-radius: 999px;
}

.more {
  margin-left: auto;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  color: #8b877c;
  padding: 2px 6px;
  border-radius: 10px;
}

.more:hover {
  background: #f4f2ec;
}

.title {
  margin: 10px 0 6px;
  font-size: 16px;
  font-weight: 900;
  color: #1e1d1a;
}

.notes {
  margin: 0 0 10px;
  font-size: 13px;
  color: #6e6a5f;
  line-height: 1.4;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.pill {
  font-size: 12px;
  background: #f4f2ec;
  padding: 6px 8px;
  border-radius: 10px;
  color: #454137;
}

.tag {
  margin-left: auto;
  font-size: 12px;
  font-weight: 900;
  color: #6e6a5f;
  background: #faf8f2;
  border: 1px solid #eee8d6;
  padding: 6px 10px;
  border-radius: 999px;
}
</style>
