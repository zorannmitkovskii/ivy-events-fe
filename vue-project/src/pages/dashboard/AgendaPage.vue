<script setup>
import {onMounted, computed, ref} from "vue";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";

import DrawerRight from "@/components/ui/DrawerRight.vue";
import {useAgenda} from "@/composables/useAgenda.js";
import AgendaEditor from "@/components/dashboard/agenda/AgendaEditor.vue";
import AgendaMultiDay from "@/components/dashboard/agenda/AgendaMultiDay.vue";
import AgendaTimeline from "@/components/dashboard/agenda/AgendaTimeline.vue";
import AgendaHeader from "@/components/dashboard/agenda/AgendaHeader.vue";


const {t} = useI18n();
const route = useRoute();
const viewMode = ref("day");

const {
  loading, error,
  days, itemsByDay,
  activeDayId, selectedItem,
  totalDurationLabel,
  loadAgenda, createItem, updateItem, deleteItem,
  selectItem, closeEditor
} = useAgenda();

const viewOptions = computed(() => [
  {value: "day", label: t("agenda.dayView")},
  {value: "multi", label: t("agenda.multiDay")}
]);

const dayTitle = computed(() => {
  const d = days.value.find(x => x.id === activeDayId.value);
  return d?.title ?? "";
});

const totalLabel = computed(() =>
  t("agenda.totalDuration", {duration: totalDurationLabel.value})
);

onMounted(async () => {
  // if you want demo when no eventId provided:
  const eventId = route.params.eventId;
  if (!eventId) await loadAgenda({useDemo: true});
  else await loadAgenda({id: eventId});
});

async function onSave(payload) {
  // payload contains editor fields
  if (payload.id) {
    await updateItem(payload.id, payload);
  } else {
    await createItem(payload);
  }
  closeEditor();
}

async function onDelete(id) {
  await deleteItem(id);
}
</script>

<template>
  <AgendaHeader
    :title="t('agenda.title')"
    :subtitle="t('agenda.subtitle', { event: 'The Annual Gala', dateRange: 'Oct 24-26, 2024' })"
    :viewMode="viewMode"
    :viewOptions="viewOptions"
    :templateLabel="t('agenda.template')"
    :addLabel="t('agenda.addItem')"
    @update:viewMode="viewMode = $event"
    @add="selectItem({ dayId: activeDayId, title:'', startTime:'', endTime:'', location:'', notes:'', responsible:'', visibility:'EVERYONE', tag:'' })"
    @template="console.log('open template')"
  />

  <div style="padding-bottom: 24px">
    <div v-if="loading" style="padding: 18px 26px;">Loading...</div>
    <div v-else-if="error" style="padding: 18px 26px; color:#b00020;">{{ error }}</div>

    <AgendaTimeline
      v-if="viewMode === 'day'"
      :dayTitle="dayTitle"
      :totalLabel="totalLabel"
      :items="itemsByDay[activeDayId] || []"
      :selectedId="selectedItem?.id"
      @select="selectItem"
    />

    <AgendaMultiDay
      v-else
      :days="days"
      :itemsByDay="itemsByDay"
      :activeDayId="activeDayId"
      :totalLabel="totalLabel"
      :selectedId="selectedItem?.id"
      @update:activeDayId="activeDayId = $event"
      @addDay="console.log('add day')"
      @select="selectItem"
    />

    <DrawerRight :open="!!selectedItem" @close="closeEditor">
      <AgendaEditor
        :titleLabel="t('agenda.editItem')"
        :saveLabel="t('agenda.saveChanges')"
        :cancelLabel="t('agenda.cancel')"
        :deleteLabel="t('agenda.delete')"
        :modelValue="selectedItem"
        @close="closeEditor"
        @save="onSave"
        @delete="onDelete"
      />
    </DrawerRight>
  </div>
</template>
