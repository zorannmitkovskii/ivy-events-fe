import { ref, computed, watchEffect } from "vue";
import { guestsService } from "@/services/guests.service";
import { tablesService } from "@/services/tables.service";
import { getDemoGuests } from "@/demo/guests.demo";
import { onboardingStore } from "@/store/onboarding.store";
import { checkDraftLimit } from "@/utils/draftLimits";

/**
 * Maps a BE guest DTO to the UI model used by GuestsTable / GuestsTableRow.
 *
 * BE DTO shape:
 *   id, eventId, name, note, tableNumber, dietaryPreferences (string|null),
 *   contactId, notificationType, inviteStatus, rsvpDate, isVip, checkInStatus, createdAt, updatedAt
 */
function mapGuest(dto) {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email ?? null,
    status: (dto.inviteStatus || "PENDING").toLowerCase(),
    plus: dto.plus ?? 0,
    tableId: dto.tableNumber ?? null,
    dietary: formatDietary(dto.dietaryPreferences),
    note: dto.note ?? "",
    isChild: dto.isChild ?? false,
    isVip: dto.isVip ?? false,
    notificationType: dto.notificationType ?? null,
    _raw: dto
  };
}

function formatDietary(dp) {
  if (!dp) return "";
  // BE may return a plain string (e.g. "VEGAN") or an object { value, description }
  if (typeof dp === "string") {
    const label = dp.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    return label === "No restrictions" ? "" : label;
  }
  const label = (dp.value || "").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  if (dp.description) return `${label} — ${dp.description}`;
  return label === "No restrictions" ? "" : label;
}

export function useGuests() {
  const eventId = computed(() => onboardingStore.eventId);

  const filters = ref({
    q: "",
    rsvp: "all",
    table: "all"
  });

  const rawList = ref([]);
  const tables = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const isDemo = computed(() => !eventId.value);

  const run = async () => {
    loading.value = true;
    error.value = null;

    try {
      if (isDemo.value) {
        const demo = getDemoGuests(eventId.value);
        rawList.value = demo.items;
        tables.value = demo.tables;
        return;
      }

      const [data, tRes] = await Promise.all([
        guestsService.list(eventId.value, "all"),
        tablesService.getTables(eventId.value)
      ]);
      const list = Array.isArray(data) ? data : data?.items ?? data?.content ?? [];
      rawList.value = list.map(mapGuest);
      tables.value = (tRes || []).map(t => ({
        id: t.id,
        name: t.title,
        capacity: t.maxGuest ?? 0,
        assigned: t.assignedGuests ?? 0,
      }));
    } catch (e) {
      // fallback to demo so you can show to clients even if BE is down
      const demo = getDemoGuests("demo");
      rawList.value = demo.items;
      tables.value = demo.tables;
      error.value = e?.message || "Failed to load guests";
    } finally {
      loading.value = false;
    }
  };

  // (re)load when eventId changes
  watchEffect(() => {
    if (eventId.value) run();
  });

  // Client-side filtering
  const items = computed(() => {
    let list = rawList.value;

    const q = (filters.value.q || "").trim().toLowerCase();
    if (q) {
      list = list.filter(
        (g) => g.name.toLowerCase().includes(q) || (g.email && g.email.toLowerCase().includes(q))
      );
    }

    if (filters.value.rsvp !== "all") {
      list = list.filter((g) => g.status === filters.value.rsvp);
    }

    if (filters.value.table !== "all") {
      if (filters.value.table === "unassigned") {
        list = list.filter((g) => !g.tableId);
      } else {
        list = list.filter((g) => g.tableId === filters.value.table);
      }
    }

    return list;
  });

  const totals = computed(() => {
    const all = rawList.value;
    return {
      total: all.length,
      confirmed: all.filter((g) => g.status === "confirmed").length,
      pending: all.filter((g) => g.status === "pending").length,
      declined: all.filter((g) => g.status === "declined").length
    };
  });

  const applyFilters = () => {}; // filtering is reactive now

  // Mutations
  const updateTable = async (guestId, tableNumber) => {
    if (isDemo.value) {
      const g = rawList.value.find((x) => x.id === guestId);
      if (g) g.tableId = tableNumber || null;
      return;
    }
    await guestsService.updateTableNumber(guestId, { tableNumber: tableNumber || null });
    await run();
  };

  const addGuest = async (payload) => {
    const limitHit = checkDraftLimit("guests", rawList.value.length);
    if (limitHit) {
      error.value = `Draft limit: maximum ${limitHit.limit} guests. Upgrade your plan to add more.`;
      return;
    }
    if (isDemo.value) {
      const id = `demo-${Date.now()}`;
      const guest = {
        id,
        name: payload.name,
        email: payload.email || null,
        status: "pending",
        plus: 0,
        tableId: null,
        dietary: "",
        note: ""
      };
      rawList.value = [guest, ...rawList.value];
      return;
    }
    const { name, isChild, ...rest } = payload;
    await guestsService.create({ ...rest, guests: [{ name, isChild: isChild ?? false }], eventId: eventId.value });
    await run();
  };

  const updateGuest = async (guestId, payload) => {
    if (isDemo.value) {
      const g = rawList.value.find((x) => x.id === guestId);
      if (g) Object.assign(g, { name: payload.name, email: payload.email, note: payload.note });
      return;
    }
    await guestsService.update(guestId, payload);
    await run();
  };

  const removeGuest = async (guestId) => {
    if (isDemo.value) {
      rawList.value = rawList.value.filter((g) => g.id !== guestId);
      return;
    }
    await guestsService.remove(guestId);
    await run();
  };

  return {
    items,
    tables,
    totals,
    filters,
    loading,
    error,
    run,
    applyFilters,
    addGuest,
    updateGuest,
    updateTable,
    removeGuest,
    isDemo
  };
}
