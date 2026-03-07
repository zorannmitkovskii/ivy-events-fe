<template>
  <tr>
    <td>
      <div class="cat-cell">
        <div class="cat-icon">{{ iconChar }}</div>
        <div class="cat-info">
          <div class="cat-name">{{ name }}</div>
          <div v-if="description" class="cat-desc">{{ description }}</div>
        </div>
      </div>
    </td>

    <td class="money-cell">{{ formatMoney(spent) }}</td>
    <td class="money-cell budget-val">{{ formatMoney(budget) }}</td>

    <td>
      <div class="progress-cell">
        <span class="percent">{{ safePercent }}%</span>
        <div class="bar">
          <div class="fill" :style="{ width: safePercent + '%' }"></div>
        </div>
      </div>
    </td>

    <td class="left-cell">{{ leftLabel || '—' }}</td>
  </tr>
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
  if (n.includes("housing") || n.includes("venue")) return "⌂";
  if (n.includes("food") || n.includes("cater")) return "🍴";
  if (n.includes("transport")) return "🚗";
  if (n.includes("entertain") || n.includes("music")) return "🎟";
  if (n.includes("shop") || n.includes("decor")) return "🛍";
  if (n.includes("photo")) return "📷";
  if (n.includes("flower") || n.includes("floral")) return "🌸";
  return "●";
});

function formatMoney(v) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: props.currency }).format(v || 0);
  } catch {
    return `${v || 0} ${props.currency}`;
  }
}
</script>

<style scoped>
.cat-cell {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.cat-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--dash-sage-ghost);
  display: grid;
  place-items: center;
  font-size: 15px;
  flex-shrink: 0;
}

.cat-name {
  font-weight: 600;
  font-size: 13.5px;
  color: var(--dash-ink);
}

.cat-desc {
  margin-top: 2px;
  font-size: 11px;
  color: var(--dash-muted);
}

.money-cell {
  font-weight: 600;
  font-size: 13px;
  color: var(--dash-ink);
  white-space: nowrap;
}

.budget-val {
  color: var(--dash-light);
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.percent {
  font-size: 11px;
  font-weight: 600;
  color: var(--dash-gold);
  width: 34px;
  flex-shrink: 0;
}

.bar {
  flex: 1;
  height: 5px;
  border-radius: 999px;
  background: var(--dash-sage-ghost);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--dash-gold), var(--dash-gold-light));
}

.left-cell {
  font-size: 12px;
  color: var(--dash-muted);
  white-space: nowrap;
}
</style>
