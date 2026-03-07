<template>
  <div class="card" :class="variant">
    <div class="label">{{ label }}</div>
    <div class="value">{{ value }}</div>

    <div v-if="pillLeft || pillRight" class="pills">
      <span v-if="pillLeft" class="pill">{{ pillLeft }}</span>
      <span v-if="pillRight" class="pill pill-muted">{{ pillRight }}</span>
    </div>

    <div v-if="hint" class="hint">{{ hint }}</div>

    <div v-if="typeof progress === 'number'" class="bar">
      <div class="fill" :style="{ width: clamp(progress) + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  hint: { type: String, default: "" },
  progress: { type: Number, default: null },
  pillLeft: { type: String, default: "" },
  pillRight: { type: String, default: "" },
  variant: { type: String, default: "light" } // light | dark
});

function clamp(p){ return Math.max(0, Math.min(100, Number(p||0))); }
</script>

<style scoped>
.card{
  border-radius: var(--dash-radius, 14px);
  padding: 20px;
  border: 1px solid var(--dash-cream-border);
  background: var(--dash-cream-card);
  box-shadow: var(--dash-shadow-sm);
  transition: all 0.22s;
}

.card:hover {
  box-shadow: var(--dash-shadow-md);
  transform: translateY(-2px);
}

.card.dark{
  background: linear-gradient(135deg, #2a3d28, #3d5637);
  border-color: transparent;
}

.label{
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dash-muted);
}

.card.dark .label{
  color: rgba(255,255,255,0.45);
}

.value{
  margin-top: 10px;
  font-family: 'Playfair Display', serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 1;
  color: var(--dash-charcoal);
}

.card.dark .value{
  color: #fff;
}

.pills{
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.pill{
  padding: 3px 8px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: var(--dash-sage-ghost);
  color: var(--dash-sage);
}

.pill-muted{
  background: transparent;
  color: var(--dash-muted);
  padding-left: 0;
}

.card.dark .pill{
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
}

.card.dark .pill-muted{
  background: transparent;
  color: rgba(255,255,255,0.4);
}

.hint{
  margin-top: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--dash-muted);
}

.card.dark .hint{
  color: rgba(255,255,255,0.45);
}

.bar{
  margin-top: 10px;
  height: 5px;
  border-radius: 999px;
  background: var(--dash-sage-ghost);
  overflow: hidden;
}

.fill{
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--dash-gold), var(--dash-gold-light));
}
</style>
