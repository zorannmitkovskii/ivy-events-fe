import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { tablesService } from "@/services/tables.service";
import { getDemoTablesSeating } from "@/demo/tables.demo";

function recomputeAssignedCounts(tables, guests) {
  const map = new Map(tables.map(t => [t.id, 0]));
  guests.forEach(g => {
    if (g.tableId && map.has(g.tableId)) map.set(g.tableId, map.get(g.tableId) + 1);
  });
  return tables.map(t => ({ ...t, assigned: map.get(t.id) || 0 }));
}

export function useTablesSeating() {
  const route = useRoute();
  const eventId = computed(() => String(route.params.eventId || "demo"));
  const isDemo = computed(() => eventId.value === "demo" || String(route.query.demo || "") === "1");

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

      const [tRes, gRes] = await Promise.all([
        tablesService.getTables(eventId.value),
        tablesService.getGuests(eventId.value)
      ]);

      tables.value = tRes || [];
      guests.value = gRes || [];
      tables.value = recomputeAssignedCounts(tables.value, guests.value);
      selectedTableId.value = tables.value[0]?.id || null;

    } catch (e) {
      error.value = e?.message || "Failed to load seating";
    } finally {
      loading.value = false;
    }
  }

  async function addGuest(payload) {
    if (isDemo.value) {
      const id = `demo-${Date.now()}`;
      guests.value = [{ id, name: payload.name, tableId: null, status: payload.status }, ...guests.value];
      tables.value = recomputeAssignedCounts(tables.value, guests.value);
      return;
    }
    await tablesService.createGuest(eventId.value, payload);
    await load();
  }

  async function changeTable({ guestId, tableId }) {
    if (isDemo.value) {
      guests.value = guests.value.map(g => g.id === guestId ? { ...g, tableId } : g);
      tables.value = recomputeAssignedCounts(tables.value, guests.value);
      return;
    }
    await tablesService.assignGuestToTable(eventId.value, guestId, tableId);
    await load();
  }

  async function removeGuest(guestId) {
    if (isDemo.value) {
      guests.value = guests.value.filter(g => g.id !== guestId);
      tables.value = recomputeAssignedCounts(tables.value, guests.value);
      return;
    }
    await tablesService.removeGuest(eventId.value, guestId);
    await load();
  }

  const filteredGuests = computed(() => {
    // if no selected table, show all (safe fallback)
    if (!selectedTableId.value) return guests.value;

    // special option: show unassigned
    if (selectedTableId.value === "unassigned") {
      return guests.value.filter(g => !g.tableId);
    }

    // normal: show only guests on selected table
    return guests.value.filter(g => g.tableId === selectedTableId.value);
  });


  return {
    eventId,
    isDemo,
    loading,
    error,
    tables,
    guests: filteredGuests,
    selectedTableId,
    load,
    addGuest,
    changeTable,
    removeGuest
  };
}
