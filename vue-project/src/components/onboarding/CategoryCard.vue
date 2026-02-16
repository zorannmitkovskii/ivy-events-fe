<template>
  <button type="button" class="card" :class="{ active }" @click="$emit('select')">
    <div class="icon" v-if="icon" aria-hidden="true">{{ icon }}</div>
    <div class="content">
      <h3 class="title">{{ title }}</h3>
      <p class="subtitle" v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div class="check" aria-hidden="true">{{ active ? '✓' : '' }}</div>
  </button>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  active: { type: Boolean, default: false }
});
</script>

<style scoped>
.card {
  display: grid;
  grid-template-columns: 40px 1fr 20px;
  gap: 10px;
  width: 100%;
  text-align: left;
  border: 1px solid var(--neutral-300);
  background: white;
  border-radius: 14px;
  padding: 12px 14px;
  cursor: pointer;
}

.card:hover {
  border-color: var(--brand-main);
}

.card.active {
  border-color: var(--brand-main);
  box-shadow: 0 0 0 3px rgba(61, 98, 71, 0.15);
}

.icon {
  font-size: 20px;
  line-height: 1;
}

.title {
  margin: 0;
  font-size: 16px;
  color: var(--neutral-900);
}

.subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--neutral-600);
}

.check {
  font-weight: 700;
  color: var(--brand-main);
}
</style>
