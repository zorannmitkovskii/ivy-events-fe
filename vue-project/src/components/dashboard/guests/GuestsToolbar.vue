<template>
  <DashboardToolbar>
    <template #actions>
      <ButtonMain variant="outline" @click="$emit('add')">{{ t("guests.addGuest") }}</ButtonMain>
      <ButtonMain variant="main" :disabled="sending" @click="$emit('remind')">
        {{ sending ? t("overview.sending") : t("guests.sendReminder") }}
      </ButtonMain>
    </template>

    <template #filters>
      <input
        type="text"
        class="filter-input"
        :placeholder="t('guests.searchPlaceholder')"
        :value="modelValue.q"
        @input="update('q', $event.target.value)"
      />

      <select class="filter-select" :value="modelValue.rsvp" @change="update('rsvp', $event.target.value)">
        <option value="all">{{ t("guests.allRsvp") }}</option>
        <option value="confirmed">{{ t("guests.confirmed") }}</option>
        <option value="pending">{{ t("guests.pending") }}</option>
        <option value="declined">{{ t("guests.declined") }}</option>
      </select>

      <select class="filter-select" :value="modelValue.table" @change="update('table', $event.target.value)">
        <option value="all">{{ t("guests.allTables") }}</option>
        <option value="unassigned">{{ t("guests.unassigned") }}</option>
        <option v-for="tbl in tableOptions" :key="tbl.id" :value="tbl.id">
          {{ tbl.name }} ({{ tbl.assigned }}/{{ tbl.capacity }})
        </option>
      </select>
    </template>
  </DashboardToolbar>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar.vue";

const { t } = useI18n();

const props = defineProps({
  modelValue: { type: Object, required: true },
  tables: { type: Array, default: () => [] },
  sending: { type: Boolean, default: false }
});
const emit = defineEmits(["update:modelValue", "add", "import", "remind", "apply"]);

const tableOptions = computed(() => props.tables || []);

function update(key, value) {
  emit("update:modelValue", { ...props.modelValue, [key]: value });
  emit("apply");
}
</script>
