<template>
  <div class="row">
    <div class="name">{{ guest.name }}</div>

    <div>
      <select class="select" :value="guest.tableId || 'unassigned'" @change="onChange">
        <option value="unassigned">{{ t("tables.unassigned") }}</option>
        <option v-for="tb in tables" :key="tb.id" :value="tb.id">
          {{ tb.name }}
        </option>
      </select>
    </div>

    <div>
      <StatusPill
        :status="guest.status"
        :label="guest.status === 'confirmed' ? t('tables.confirmed') : t('tables.pending')"
      />
    </div>

    <div class="right">
      <button class="remove" @click="$emit('remove')">{{ t("tables.remove") }}</button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import StatusPill from "@/components/ui/StatusPill.vue";

const { t } = useI18n();
const props = defineProps({
  guest: Object,
  tables: Array
});
defineEmits(["change-table", "remove"]);

function onChange(e) {
  const tableId = e.target.value;
  props.guest.tableId = tableId === "unassigned" ? null : tableId; // local immediate UI feel
  // notify parent
  // payload: { guestId, tableId|null }
  // eslint-disable-next-line vue/require-explicit-emits
  emit("change-table", { guestId: props.guest.id, tableId: props.guest.tableId });
}
</script>

<script>
/* Workaround for emit usage in <script setup> across lint configs */
export default {
  emits: ["change-table", "remove"]
};
</script>

<style scoped>
.row{
  display:grid;
  grid-template-columns: 1.3fr 1fr .7fr .6fr;
  gap: 12px;
  align-items:center;
  padding: 12px 4px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.name{ font-weight: 900; }
.right{ text-align:right; }
.remove{
  background: transparent;
  border: 0;
  color: #d32f2f;
  font-weight: 900;
  cursor: pointer;
}
.remove:hover{ text-decoration: underline; }
.select{
  width: 100%;
  border: 1px solid rgba(0,0,0,0.10);
  background: rgba(255,255,255,0.90);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 13px;
}
</style>
