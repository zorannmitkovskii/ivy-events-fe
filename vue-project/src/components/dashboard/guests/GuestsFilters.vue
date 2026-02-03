<template>
  <div class="card card-pad">
    <div class="filters-grid">
      <input
        class="input"
        :placeholder="t('guests.searchPlaceholder')"
        :value="modelValue.q"
        @input="update('q', $event.target.value)"
      />

      <select class="select" :value="modelValue.rsvp" @change="update('rsvp', $event.target.value)">
        <option value="all">{{ t("guests.allRsvp") }}</option>
        <option value="accepted">{{ t("guests.accepted") }}</option>
        <option value="pending">{{ t("guests.pending") }}</option>
        <option value="declined">{{ t("guests.declined") }}</option>
      </select>

      <select class="select" :value="modelValue.table" @change="update('table', $event.target.value)">
        <option value="all">{{ t("guests.allTables") }}</option>
        <option value="unassigned">{{ t("guests.unassigned") }}</option>
        <option v-for="tItem in tableOptions" :key="tItem.id" :value="tItem.id">
          {{ tItem.name }} ({{ tItem.assigned }}/{{ tItem.capacity }})
        </option>
      </select>

      <button class="btn btn-ghost" @click="$emit('apply')">
        Apply
      </button>
    </div>
  </div>
</template>


<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = defineProps({
  modelValue: { type: Object, required: true },
  tables: { type: Array, default: () => [] }
});
const emit = defineEmits(["update:modelValue", "apply"]);

const tableOptions = computed(() => props.tables || []);

function update(key, value) {
  emit("update:modelValue", { ...props.modelValue, [key]: value });
}
</script>

<style scoped>
</style>
