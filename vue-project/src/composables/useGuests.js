import { ref, computed, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { guestsService } from "@/services/guests.service";
import { getDemoGuests } from "@/demo/guests.demo";
import { useAuthUser } from "@/composables/useAuthUser";

export function useGuests() {
  const route = useRoute();
  const { eventId } = useAuthUser();

  const filters = ref({
    q: "",
    rsvp: "all",
    table: "all"
  });

  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const isDemo = computed(() => String(route.query.demo || "") === "1" || eventId.value === "demo");

  const run = async () => {
    loading.value = true;
    error.value = null;

    try {
      if (isDemo.value) {
        data.value = getDemoGuests(eventId.value);
        return;
      }

      const params = {
        q: filters.value.q || undefined,
        rsvp: filters.value.rsvp !== "all" ? filters.value.rsvp : undefined,
        tableId: filters.value.table !== "all" ? filters.value.table : undefined
      };

      data.value = await guestsService.list(eventId.value, params);
    } catch (e) {
      // fallback to demo so you can show to clients even if BE is down
      data.value = getDemoGuests("demo");
      error.value = e?.message || "Failed to load guests";
    } finally {
      loading.value = false;
    }
  };

  // (re)load when eventId changes
  watchEffect(() => {
    if (eventId.value) run();
  });

  // update filters (trigger reload) - basic debounce could be added later
  const applyFilters = () => run();

  // Mutations: update table assignment
  const updateTable = async (guestId, tableId) => {
    if (isDemo.value) {
      // local update only
      const g = data.value?.items?.find((x) => x.id === guestId);
      if (g) g.tableId = tableId || null;
      return;
    }
    await guestsService.updateTable(eventId.value, guestId, tableId || null);
    await run();
  };

  const removeGuest = async (guestId) => {
    if (isDemo.value) {
      data.value.items = data.value.items.filter((g) => g.id !== guestId);
      return;
    }
    await guestsService.remove(eventId.value, guestId);
    await run();
  };

  const tables = computed(() => data.value?.tables || []);
  const items = computed(() => data.value?.items || []);
  const totals = computed(() => data.value?.totals || null);

  return { data, items, tables, totals, filters, loading, error, run, applyFilters, updateTable, removeGuest, isDemo };
}
