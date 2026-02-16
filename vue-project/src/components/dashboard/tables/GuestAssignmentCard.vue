<template>
  <DashboardTable>
    <template #head>
      <th>{{ t("tables.guestName") }}</th>
      <th>{{ t("tables.assignedTable") }}</th>
      <th>{{ t("tables.status") }}</th>
      <th class="th-right">{{ t("tables.action") }}</th>
    </template>

    <template #body>
      <GuestAssignmentRow
        v-for="g in guests"
        :key="g.id"
        :guest="g"
        :tables="tables"
        @change-table="$emit('change-table', $event)"
        @remove="$emit('remove', g.id)"
        @edit="$emit('edit', $event)"
      />
    </template>
  </DashboardTable>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import DashboardTable from "@/components/dashboard/DashboardTable.vue";
import GuestAssignmentRow from "./GuestAssignmentRow.vue";

defineProps({
  guests: Array,
  tables: Array
});
defineEmits(["add-guest", "change-table", "remove", "edit"]);

const { t } = useI18n();
</script>

<style scoped>
.th-right {
  text-align: right;
}
</style>
