<template>
  <tr class="clickable-row" @click="$emit('edit', guest)">
    <td>
      <span class="name">{{ guest.name }}</span>
    </td>

    <td>
      <select class="table-select" :value="guest.tableId || 'unassigned'" @change="onChange" @click.stop>
        <option value="unassigned">{{ t("tables.unassigned") }}</option>
        <option v-for="tb in tables" :key="tb.id" :value="tb.id">
          {{ tb.name }}
        </option>
      </select>
    </td>

    <td>
      <StatusPill
        :status="guest.status"
        :label="guest.status === 'confirmed' ? t('tables.confirmed') : t('tables.pending')"
      />
    </td>

    <td class="td-right">
      <button class="remove" type="button" @click.stop="emit('remove')">{{ t("tables.remove") }}</button>
    </td>
  </tr>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import StatusPill from "@/components/ui/StatusPill.vue";

const { t } = useI18n();
const props = defineProps({
  guest: Object,
  tables: Array
});
const emit = defineEmits(["change-table", "remove", "edit"]);

function onChange(e) {
  const tableId = e.target.value;
  props.guest.tableId = tableId === "unassigned" ? null : tableId;
  emit("change-table", { guestId: props.guest.id, tableId: props.guest.tableId });
}
</script>

<style scoped>
.name {
  font-weight: 600;
  font-size: 13.5px;
  color: var(--dash-ink);
}

.td-right {
  text-align: right;
}

.remove {
  background: transparent;
  border: 0;
  color: var(--dash-blush);
  font-weight: 500;
  font-size: 12.5px;
  cursor: pointer;
  transition: color 0.15s ease;
}

.remove:hover {
  color: #9a5e56;
}

.table-select {
  width: 100%;
  max-width: 170px;
  border: 1.5px solid var(--dash-cream-border);
  background: var(--dash-cream);
  border-radius: 9px;
  padding: 7px 12px;
  font-size: 12.5px;
  font-family: 'Outfit', sans-serif;
  color: var(--dash-ink);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.table-select:focus {
  border-color: var(--dash-sage-light);
  box-shadow: 0 0 0 3px rgba(90, 122, 82, 0.1);
  background: var(--dash-cream-card);
}

.clickable-row {
  cursor: pointer;
}
</style>
