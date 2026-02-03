// src/composables/useAgenda.js
import { computed, ref } from "vue";
import { agendaApi } from "@/services/agenda.service.js";

export function useAgenda() {
  const loading = ref(false);
  const error = ref(null);

  const eventId = ref(null);

  const days = ref([]);
  const items = ref([]);

  const activeDayId = ref("");
  const selectedItem = ref(null);

  const itemsByDay = computed(() => {
    const map = {};
    for (const d of days.value) map[d.id] = [];
    for (const it of items.value) {
      if (!map[it.dayId]) map[it.dayId] = [];
      map[it.dayId].push(it);
    }
    // optional: sort by startTime
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
    }
    return map;
  });

  const totalDurationLabel = computed(() => {
    // simple total for active day; replace with BE-provided total if you have it
    const list = itemsByDay.value[activeDayId.value] ?? [];
    let minutes = 0;

    for (const it of list) {
      const [sh, sm] = (it.startTime || "00:00").split(":").map(Number);
      const [eh, em] = (it.endTime || "00:00").split(":").map(Number);
      minutes += Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
    }

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  });

  async function loadAgenda({ useDemo = false, id = null } = {}) {
    loading.value = true;
    error.value = null;

    try {
      const data = useDemo
        ? await agendaApi.getDemoAgenda()
        : await agendaApi.getAgenda(id);

      eventId.value = data.eventId ?? id ?? "demo";
      days.value = data.days ?? [];
      items.value = data.items ?? [];

      activeDayId.value = days.value[0]?.id ?? "";
      selectedItem.value = null;
    } catch (e) {
      error.value = e?.message ?? "Failed to load agenda";
    } finally {
      loading.value = false;
    }
  }

  async function createItem(payload) {
    if (!eventId.value) throw new Error("Missing eventId");
    const created = await agendaApi.createItem(eventId.value, payload);
    items.value.push(created);
    return created;
  }

  async function updateItem(itemId, payload) {
    if (!eventId.value) throw new Error("Missing eventId");
    const updated = await agendaApi.updateItem(eventId.value, itemId, payload);
    const idx = items.value.findIndex(x => x.id === itemId);
    if (idx !== -1) items.value[idx] = updated;
    return updated;
  }

  async function deleteItem(itemId) {
    if (!eventId.value) throw new Error("Missing eventId");
    await agendaApi.deleteItem(eventId.value, itemId);
    items.value = items.value.filter(x => x.id !== itemId);
    if (selectedItem.value?.id === itemId) selectedItem.value = null;
  }

  function selectItem(it) {
    selectedItem.value = { ...it };
  }

  function closeEditor() {
    selectedItem.value = null;
  }

  return {
    loading,
    error,

    days,
    items,
    itemsByDay,

    activeDayId,
    selectedItem,

    totalDurationLabel,

    loadAgenda,
    createItem,
    updateItem,
    deleteItem,

    selectItem,
    closeEditor
  };
}
