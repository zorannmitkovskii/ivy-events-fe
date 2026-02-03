<template>
  <div class="card">
    <table class="table">
      <thead>
      <tr>
        <th>{{ t("guests.thGuestName") }}</th>
        <th>{{ t("guests.thRsvp") }}</th>
        <th>{{ t("guests.thPlus") }}</th>
        <th>{{ t("guests.thTable") }}</th>
        <th>{{ t("guests.thNotes") }}</th>
        <th style="text-align:right;">{{ t("guests.thActions") }}</th>
      </tr>
      </thead>

      <tbody>
      <GuestsTableRow
        v-for="g in rows"
        :key="g.id"
        :guest="g"
        :tables="tables"
        @changeTable="$emit('changeTable', $event)"
        @remove="$emit('remove', $event)"
      />
      </tbody>
    </table>

    <div class="card-pad" v-if="totals">
      <span class="small"><b>{{ totals.total }}</b> guests</span>
      <span class="small" style="margin-left:10px; color:#2f3e36;">• {{ totals.accepted }} accepted</span>
      <span class="small" style="margin-left:10px; color:#334338;">• {{ totals.pending }} pending</span>
      <span class="small" style="margin-left:10px; color:var(--error);">• {{ totals.declined }} declined</span>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import GuestsTableRow from "./GuestsTableRow.vue";

const { t } = useI18n();

defineProps({
  rows: { type: Array, default: () => [] },
  tables: { type: Array, default: () => [] },
  totals: { type: Object, default: null }
});
defineEmits(["changeTable", "remove"]);
</script>
