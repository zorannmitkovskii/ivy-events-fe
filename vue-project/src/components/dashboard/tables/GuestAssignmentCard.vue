<template>
  <BaseCard :title="t('tables.guestAssignment')">
    <template #action>
      <BaseButton variant="primary" @click="$emit('add-guest')">
        {{ t("tables.addGuest") }}
      </BaseButton>
    </template>

    <div class="thead">
      <div>{{ t("tables.guestName") }}</div>
      <div>{{ t("tables.assignedTable") }}</div>
      <div>{{ t("tables.status") }}</div>
      <div class="right">{{ t("tables.action") }}</div>
    </div>

    <div class="rows">
      <GuestAssignmentRow
        v-for="g in guests"
        :key="g.id"
        :guest="g"
        :tables="tables"
        @change-table="$emit('change-table', $event)"
        @remove="$emit('remove', g.id)"
      />
    </div>
  </BaseCard>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import BaseCard from "@/components/ui/BaseCard.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import GuestAssignmentRow from "./GuestAssignmentRow.vue";

defineProps({
  guests: Array,
  tables: Array
});
defineEmits(["add-guest", "change-table", "remove"]);

const { t } = useI18n();
</script>

<style scoped>
.thead{
  display:grid;
  grid-template-columns: 1.3fr 1fr .7fr .6fr;
  gap: 12px;
  padding: 10px 4px;
  font-size: 12px;
  font-weight: 900;
  color: var(--neutral-700);
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.rows{ display:grid; }
.right{ text-align:right; }
</style>
