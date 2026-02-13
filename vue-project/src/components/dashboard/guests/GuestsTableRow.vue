<template>
  <tr :class="{ 'row-declined': isDeclined }">
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
        <button class="action-link" type="button" @click="$emit('edit', guest)">{{ t("guests.edit") }}</button>
        <button class="action-link action-remove" type="button" @click="$emit('remove', guest.id)">
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
  opacity: 0.65;
}

.guest-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--neutral-900);
}

.guest-email {
  font-size: 13px;
  color: var(--neutral-500);
  margin-top: 2px;
}

/* Status select */
.status-select {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  border: none;
  outline: none;
  cursor: pointer;
  appearance: auto;
}

.pill-confirmed {
  background: var(--success);
  color: var(--brand-main);
}

.pill-pending {
  background: var(--brand-dark);
  color: #fff;
}

.pill-declined {
  background: rgba(237, 110, 105, 0.18);
  color: var(--error);
}

/* Table select */
.table-select {
  padding: 8px 12px;
  border: 1px solid var(--neutral-300);
  border-radius: 8px;
  font-size: 13px;
  color: var(--neutral-900);
  background: #fff;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  max-width: 170px;
}

.table-select:focus {
  border-color: var(--brand-gold);
  box-shadow: 0 0 0 3px rgba(200, 162, 77, 0.15);
}

.table-select:disabled {
  background: var(--bg-main);
  color: var(--neutral-500);
  cursor: not-allowed;
}

.dietary-cell {
  font-size: 13px;
  color: var(--neutral-500);
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
  font-size: 13px;
  font-weight: 500;
  color: var(--brand-dark);
  transition: color 0.15s ease;
}

.action-link:hover {
  color: var(--brand-main);
}

.action-remove {
  color: var(--error);
}

.action-remove:hover {
  color: #c0302b;
}
</style>
