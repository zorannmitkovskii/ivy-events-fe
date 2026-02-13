import { computed, ref, watch } from "vue";
import { tablesService } from "@/services/tables.service";
import { guestsService } from "@/services/guests.service";
import { getDemoTablesSeating } from "@/demo/tables.demo";
import { onboardingStore } from "@/store/onboarding.store";

function mapTable(dto) {
  return {
    id: dto.id,
    name: dto.title,
    capacity: dto.maxGuest,
    assigned: dto.assignedGuests || 0,
  };
}

function recomputeAssignedCounts(tables, guests) {
  const map = new Map(tables.map(t => [t.id, 0]));
  guests.forEach(g => {
    if (g.tableId && map.has(g.tableId)) map.set(g.tableId, map.get(g.tableId) + 1);
  });
  return tables.map(t => ({ ...t, assigned: map.get(t.id) || 0 }));
}

export function useTablesSeating() {
  const eventId = computed(() => onboardingStore.eventId || "");
  const isDemo = computed(() => !eventId.value);

  const loading = ref(false);
  const error = ref(null);

  const tables = ref([]);
  const guests = ref([]);
  const selectedTableId = ref(null);

  async function load() {
    loading.value = true;
    error.value = null;

    try {
      if (isDemo.value) {
        const demo = getDemoTablesSeating();
        tables.value = demo.tables;
        guests.value = demo.guests;
        selectedTableId.value = demo.tables[0]?.id || null;
        return;
      }

      const raw = (await tablesService.getTables(eventId.value)) || [];
      tables.value = raw.map(mapTable);
      selectedTableId.value = "unassigned";
      await loadGuests();

    } catch (e) {
      error.value = e?.message || "Failed to load seating";
    } finally {
      loading.value = false;
    }
  }

  async function loadGuests() {
    const tableId = selectedTableId.value === "unassigned" ? null : selectedTableId.value;
    const data = await guestsService.listPerTable(eventId.value, tableId);
    const list = Array.isArray(data) ? data : data?.items ?? data?.content ?? [];
    guests.value = list.map(dto => ({
      id: dto.id,
      name: dto.name,
      tableId: dto.tableNumber ?? null,
      status: (dto.inviteStatus || "PENDING").toLowerCase(),
      isChild: dto.isChild ?? false,
    }));
  }

  // Reload guests when selected table changes
  watch(selectedTableId, async (newVal, oldVal) => {
    if (!eventId.value || isDemo.value || oldVal === null) return;
    try {
      await loadGuests();
    } catch (e) {
      error.value = e?.message || "Failed to load guests";
    }
  });

  async function addTable(payload) {
    if (isDemo.value) {
      const id = `t-${Date.now()}`;
      tables.value = [...tables.value, { id, name: payload.name, capacity: payload.capacity, assigned: 0 }];
      selectedTableId.value = id;
      return;
    }
    await tablesService.createTable({
      eventId: eventId.value,
      title: payload.name,
      maxGuest: payload.capacity,
    });
    await load();
  }

  async function addGuest(payload) {
    if (isDemo.value) {
      const id = `demo-${Date.now()}`;
      guests.value = [{ id, name: payload.name, tableId: null, status: payload.status }, ...guests.value];
      tables.value = recomputeAssignedCounts(tables.value, guests.value);
      return;
    }
    await tablesService.createGuest({ ...payload, eventId: eventId.value });
    await load();
  }

  async function changeTable({ guestId, tableId }) {
    if (isDemo.value) {
      guests.value = guests.value.map(g => g.id === guestId ? { ...g, tableId } : g);
      tables.value = recomputeAssignedCounts(tables.value, guests.value);
      return;
    }
    await guestsService.updateTableNumber(guestId, { tableNumber: tableId });
    await load();
  }

  async function removeGuest(guestId) {
    if (isDemo.value) {
      guests.value = guests.value.filter(g => g.id !== guestId);
      tables.value = recomputeAssignedCounts(tables.value, guests.value);
      return;
    }
    await tablesService.removeGuest(guestId);
    await load();
  }

  return {
    eventId,
    isDemo,
    loading,
    error,
    tables,
    guests,
    selectedTableId,
    load,
    addTable,
    addGuest,
    changeTable,
    removeGuest
  };
}
