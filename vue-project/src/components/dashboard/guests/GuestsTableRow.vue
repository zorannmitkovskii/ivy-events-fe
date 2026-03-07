<template>
  <tr class="clickable-row" :class="{ 'row-declined': isDeclined }" @click="$emit('edit', guest)">
    <td>
      <div class="guest-name">{{ guest.name }}</div>
      <div class="guest-email">{{ guest.email }}</div>
    </td>

    <td>
      <select
        class="status-select"
        :class="pillClass"
        :value="guest.status"
        @change="onChangeStatus($event.target.value)"
        @click.stop
      >
        <option value="confirmed">{{ t("guests.confirmed") }}</option>
        <option value="pending">{{ t("guests.pending") }}</option>
        <option value="declined">{{ t("guests.declined") }}</option>
      </select>
    </td>

    <td>{{ plusLabel }}</td>

    <td>
      <select
        class="table-select"
        :value="tableSelectValue"
        :disabled="isDeclined"
        @change="onChangeTable($event.target.value)"
        @click.stop
      >
        <option value="unassigned">{{ t("guests.unassigned") }}</option>
        <option v-for="tb in tables" :key="tb.id" :value="tb.id">
          {{ tb.name }} ({{ tb.assigned }}/{{ tb.capacity }})
        </option>
      </select>
    </td>

    <td class="dietary-cell">{{ guest.dietary || "—" }}</td>

    <td>
      <div class="actions">
        <button class="action-link" type="button" @click.stop="$emit('edit', guest)">{{ t("guests.edit") }}</button>
        <button class="action-link action-remove" type="button" @click.stop="$emit('remove', guest.id)">
          {{ t("guests.remove") }}
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  guest: { type: Object, required: true },
  tables: { type: Array, default: () => [] }
});
const emit = defineEmits(["changeTable", "changeStatus", "remove", "edit"]);

const isDeclined = computed(() => props.guest.status === "declined");

const pillClass = computed(() => {
  if (props.guest.status === "confirmed") return "pill-confirmed";
  if (props.guest.status === "pending") return "pill-pending";
  return "pill-declined";
});

const plusLabel = computed(() => {
  const p = Number(props.guest.plus || 0);
  return p > 0 ? `+${p}` : "+0";
});

const tableSelectValue = computed(() => props.guest.tableId || "unassigned");

function onChangeTable(value) {
  emit("changeTable", { guestId: props.guest.id, tableId: value === "unassigned" ? null : value });
}

function onChangeStatus(value) {
  emit("changeStatus", { guestId: props.guest.id, status: value });
}
</script>

<style scoped>
.row-declined {
  opacity: 0.55;
}

.guest-name {
  font-weight: 600;
  font-size: 13.5px;
  color: var(--dash-ink);
}

.guest-email {
  font-size: 12px;
  color: var(--dash-light);
  margin-top: 2px;
}

/* Status select */
.status-select {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  border: none;
  outline: none;
  cursor: pointer;
  appearance: auto;
  letter-spacing: 0.02em;
}

.pill-confirmed {
  background: var(--dash-sage-ghost);
  color: var(--dash-sage);
}

.pill-pending {
  background: var(--dash-gold-pale);
  color: #8a6a30;
}

.pill-declined {
  background: var(--dash-blush-pale);
  color: #9a5e56;
}

/* Table select */
.table-select {
  padding: 7px 12px;
  border: 1.5px solid var(--dash-cream-border);
  border-radius: 9px;
  font-size: 12.5px;
  font-family: 'Outfit', sans-serif;
  color: var(--dash-ink);
  background: var(--dash-cream);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  max-width: 170px;
}

.table-select:focus {
  border-color: var(--dash-sage-light);
  box-shadow: 0 0 0 3px rgba(90, 122, 82, 0.1);
  background: var(--dash-cream-card);
}

.table-select:disabled {
  background: var(--dash-cream);
  color: var(--dash-light);
  cursor: not-allowed;
}

.dietary-cell {
  font-size: 12px;
  color: var(--dash-light);
}

/* Text-only action buttons */
.actions {
  display: flex;
  gap: 12px;
}

.action-link {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--dash-sage);
  transition: color 0.15s ease;
}

.action-link:hover {
  color: var(--dash-sage-dark);
}

.action-remove {
  color: var(--dash-blush);
}

.action-remove:hover {
  color: #9a5e56;
}

.clickable-row {
  cursor: pointer;
}
</style>
