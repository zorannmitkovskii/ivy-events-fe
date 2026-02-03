<template>
  <BaseCard :title="t('tables.tableList')">
    <div class="list">
      <TableListItem
        v-for="tItem in tables"
        :key="tItem.id"
        :table="tItem"
        :selected="tItem.id === selectedId"
        @select="$emit('select', tItem.id)"
      />
    </div>
  </BaseCard>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import BaseCard from "@/components/ui/BaseCard.vue";
import TableListItem from "./TableListItem.vue";

defineProps({
  tables: Array,
  selectedId: String
});
defineEmits(["select"]);
const { t } = useI18n();
</script>

<style scoped>
.list{ display:grid; gap: 12px; }
</style>
