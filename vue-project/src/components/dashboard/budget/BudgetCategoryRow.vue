<template>
  <div class="row">
    <div class="left">
      <div class="icon">{{ iconChar }}</div>
      <div class="info">
        <div class="name">{{ name }}</div>
        <div v-if="description" class="desc">{{ description }}</div>
      </div>
    </div>

    <div class="right">
      <div class="money">
        <span class="spent">{{ money(spent) }}</span>
        <span class="slash">/</span>
        <span class="budget">{{ money(budget) }}</span>
      </div>
      <div class="leftText" v-if="leftLabel">{{ leftLabel }}</div>
    </div>

    <div class="progressWrap">
      <div class="percent">{{ safePercent }}%</div>
      <div class="bar">
        <div class="fill" :style="{ width: safePercent + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  currency: { type: String, default: "EUR" },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  spent: { type: Number, default: 0 },
  budget: { type: Number, default: 0 },
  percent: { type: Number, default: 0 },
  leftLabel: { type: String, default: "" }
});

const safePercent = computed(() => Math.max(0, Math.min(100, Math.round(props.percent || 0))));

const iconChar = computed(() => {
  const n = (props.name || "").toLowerCase();
  if (n.includes("housing")) return "⌂";
  if (n.includes("food")) return "🍴";
  if (n.includes("transport")) return "🚗";
  if (n.includes("entertain")) return "🎟";
  if (n.includes("shop")) return "🛍";
  return "●";
});

function money(v){
  try { return new Intl.NumberFormat(undefined,{style:"currency",currency:props.currency}).format(v||0); }
  catch { return `${v||0} ${props.currency}`; }
}
</script>

<style scoped>
.row{
  padding:18px;
  display:grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 10px 14px;
  border-bottom: 1px solid var(--brand-dark);
}

.row:last-child{ border-bottom:0; }

.left{
  display:flex;
  gap:12px;
  align-items:center;
  min-width:0;
}

.icon{
  width:36px;height:36px;
  border-radius:999px;
  background: var(--brand-light);
  display:grid;
  place-items:center;
  font-weight:900;
  color: var(--brand-main);
}

.name{
  font-weight:900;
  color: var(--brand-main);
}

.desc{
  margin-top:2px;
  font-size:12px;
  font-weight:700;
  color: var(--brand-dark);
}

.right{ text-align:right; }
.money{ font-weight:900; color: var(--brand-main); white-space:nowrap; }
.slash,.budget{ color: var(--brand-dark); font-weight:900; }
.leftText{ margin-top:6px; font-size:12px; font-weight:900; color: var(--brand-dark); }

.progressWrap{
  grid-column: 1 / -1;
  display:grid;
  grid-template-columns: 44px 1fr;
  gap:10px;
  align-items:center;
}

.percent{ font-size:12px; font-weight:900; color: var(--brand-gold); }

.bar{
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

@media (max-width: 650px){
  .row{ grid-template-columns:1fr; }
  .right{ text-align:left; }
}
</style>
