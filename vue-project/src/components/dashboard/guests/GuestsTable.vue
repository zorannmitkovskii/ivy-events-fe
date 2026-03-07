<template>
  <DashboardTable>
    <template #head>
      <th>{{ t("guests.thGuestName") }}</th>
      <th>{{ t("guests.thRsvp") }}</th>
      <th>{{ t("guests.thPlus") }}</th>
      <th>{{ t("guests.thTable") }}</th>
      <th>{{ t("guests.thDietary") }}</th>
      <th>{{ t("guests.thActions") }}</th>
    </template>

    <template #body>
      <GuestsTableRow
        v-for="g in rows"
        :key="g.id"
        :guest="g"
        :tables="tables"
        @changeTable="$emit('changeTable', $event)"
        @changeStatus="$emit('changeStatus', $event)"
        @remove="$emit('remove', $event)"
        @edit="$emit('edit', $event)"
      />
    </template>

    <template v-if="totals" #footer>
      <span class="stat"><strong>{{ totals.total }} {{ t("guests.thPlus").toLowerCase() }}</strong></span>
      <span class="stat stat-confirmed">{{ totals.confirmed }} {{ t("guests.confirmed").toLowerCase() }}</span>
      <span class="stat stat-pending">{{ totals.pending }} {{ t("guests.pending").toLowerCase() }}</span>
      <span class="stat stat-declined">{{ totals.declined }} {{ t("guests.declined").toLowerCase() }}</span>
    </template>
  </DashboardTable>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import DashboardTable from "@/components/dashboard/DashboardTable.vue";
import GuestsTableRow from "./GuestsTableRow.vue";

const { t } = useI18n();

defineProps({
  rows: { type: Array, default: () => [] },
  tables: { type: Array, default: () => [] },
  totals: { type: Object, default: null }
});
defineEmits(["changeTable", "changeStatus", "remove", "edit"]);
</script>

<style scoped>
.stat strong {
  color: var(--dash-ink);
}

.stat-confirmed {
  color: var(--dash-sage);
  font-weight: 600;
}

.stat-pending {
  color: var(--dash-gold);
  font-weight: 600;
}

.stat-declined {
  color: var(--dash-blush);
  font-weight: 600;
}
</style>
