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
  border-radius:16px;
  padding:18px;
  border: 1px solid var(--brand-dark);
  background:#fff;
  box-shadow: 0 6px 16px #00000012;
}

.card.dark{
  background: var(--brand-main);
  border-color: var(--brand-main);
  box-shadow: 0 14px 26px #0000001F;
}

.label{
  font-size:12px;
  font-weight:900;
  letter-spacing:0.08em;
  text-transform:uppercase;
  color: var(--brand-dark);
}

.card.dark .label{
  color: var(--brand-light);
}

.value{
  margin-top:10px;
  font-size:30px;
  font-weight:900;
  color: var(--brand-main);
}

.card.dark .value{
  color:#fff;
}

.pills{
  display:flex;
  gap:10px;
  margin-top:10px;
  flex-wrap:wrap;
}

.pill{
  padding:4px 8px;
  border-radius:10px;
  font-weight:900;
  font-size:12px;
  background: var(--brand-light);
  color: var(--brand-main);
}

.pill-muted{
  background: transparent;
  color: var(--brand-dark);
  padding-left:0;
}

.card.dark .pill{
  background: var(--brand-dark);
  color:#fff;
}

.card.dark .pill-muted{
  background: transparent;
  color: var(--brand-light);
}

.hint{
  margin-top:8px;
  font-size:12px;
  font-weight:800;
  color: var(--brand-dark);
}

.card.dark .hint{
  color: var(--brand-light);
}

.bar{
  margin-top:10px;
  height:6px;
  border-radius:999px;
  background: var(--brand-light);
  overflow:hidden;
}

.fill{
  height:100%;
  border-radius:999px;
  background: var(--brand-gold);
}
</style>
