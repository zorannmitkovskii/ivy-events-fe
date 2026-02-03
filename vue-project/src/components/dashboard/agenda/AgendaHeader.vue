<template>
  <header class="agenda-header">
    <div class="left">
      <h1 class="title">{{ title }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
    </div>

    <div class="right">
      <SegmentedToggle
        :modelValue="viewMode"
        :options="viewOptions"
        @update:modelValue="$emit('update:viewMode', $event)"
      />

      <button class="btn btn-ghost" type="button" @click="$emit('template')">
        {{ templateLabel }}
      </button>

      <button class="btn btn-primary" type="button" @click="$emit('add')">
        + {{ addLabel }}
      </button>
    </div>
  </header>
</template>

<script setup>
import SegmentedToggle from "@/components/ui/SegmentedToggle.vue";

defineProps({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },

  viewMode: { type: String, required: true }, // "day" | "multi"
  viewOptions: { type: Array, required: true }, // [{value,label}]

  templateLabel: { type: String, required: true },
  addLabel: { type: String, required: true }
});

defineEmits(["update:viewMode", "template", "add"]);
</script>

<style scoped>
.agenda-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 26px;
  border-bottom: 1px solid #eae6d9;
  background: #f7f6f2;
  position: sticky;
  top: 0;
  z-index: 3;
}

.left {
  min-width: 0;
}

.title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #1d1d1b;
}

.subtitle {
  margin: 6px 0 0 0;
  font-size: 13px;
  color: #6e6a5f;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn {
  border-radius: 10px;
  padding: 9px 12px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  background: #fff;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.btn:active {
  transform: translateY(1px);
}

.btn-ghost {
  background: #fff;
  border-color: #e1ddcf;
  color: #3a362f;
}

.btn-primary {
  background: #2f3e36;
  color: #fff;
  border-color: #2f3e36;
  box-shadow: 0 8px 18px rgba(47, 62, 54, 0.18);
}

@media (max-width: 900px) {
  .agenda-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .right {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
