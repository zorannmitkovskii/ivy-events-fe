<template>
  <tr>
    <td>
      <div style="font-weight:900;">{{ guest.name }}</div>
      <div class="small">{{ guest.email }}</div>
    </td>

    <td>
      <span class="pill" :class="pillClass">{{ rsvpLabel }}</span>
    </td>

    <td>{{ plusLabel }}</td>

    <td>
      <select class="select" style="max-width:170px;" :value="tableSelectValue" @change="onChangeTable($event.target.value)">
        <option value="unassigned">{{ t("guests.unassigned") }}</option>
        <option v-for="tb in tables" :key="tb.id" :value="tb.id">
          {{ tb.name }} ({{ tb.assigned }}/{{ tb.capacity }})
        </option>
      </select>
    </td>

    <td class="small">{{ guest.note || "—" }}</td>

    <td style="text-align:right;">
      <button class="btn btn-ghost" style="padding:8px 12px;">{{ t("guests.edit") }}</button>
      <button class="btn btn-ghost" style="padding:8px 12px; color: var(--error);" @click="$emit('remove', guest.id)">
        {{ t("guests.remove") }}
      </button>
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
const emit = defineEmits(["changeTable", "remove"]);

const pillClass = computed(() => {
  if (props.guest.status === "accepted") return "pill-accepted";
  if (props.guest.status === "pending") return "pill-pending";
  return "pill-declined";
});

const rsvpLabel = computed(() => {
  if (props.guest.status === "accepted") return t("guests.accepted");
  if (props.guest.status === "pending") return t("guests.pending");
  return t("guests.declined");
});

const plusLabel = computed(() => {
  const p = Number(props.guest.plus || 0);
  return p > 0 ? `+${p}` : "+0";
});

const tableSelectValue = computed(() => props.guest.tableId || "unassigned");

function onChangeTable(value) {
  emit("changeTable", { guestId: props.guest.id, tableId: value === "unassigned" ? null : value });
}
</script>
