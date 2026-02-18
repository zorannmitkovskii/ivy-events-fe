import { ref, computed, onMounted } from "vue";
import { getDemoOverview } from "@/demo/overview.demo";
import { eventsService } from "@/services/events.service";
import { tasksService } from "@/services/tasks.service";
import { guestsService } from "@/services/guests.service";
import { budgetsService } from "@/services/budgets.service";
import { tablesService } from "@/services/tables.service";
import { mediaService } from "@/services/media.service";
import { onboardingStore, setSelectedCategory, setEventStatus } from "@/store/onboarding.store";
import { EventCategoryEnum } from "@/enums/EventCategory";

export function useOverview() {
  const eventId = computed(() => onboardingStore.eventId);

  const data = getDemoOverview(eventId.value);

  const event = ref(data.event);
  const overview = ref(data.overview);

  async function loadEvent() {
    try {
      const ev = await eventsService.getById(eventId.value);
      event.value.name = ev.name || ev.title || "";
      event.value.status = ev.status || "PLANNING";
      setEventStatus(ev.status || "PLANNING");

      const cat = ev.categoryType || ev.category || "";
      if (cat) {
        const upper = cat.toUpperCase().replace(/\s+/g, "_");
        const match = Object.values(EventCategoryEnum).find(v => v === upper);
        setSelectedCategory(match || cat);
      }

      if (ev.date || ev.eventDate) {
        const dateStr = ev.date || ev.eventDate;
        event.value.rawDate = dateStr;
        const d = new Date(dateStr);
        event.value.date = d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        event.value.daysLeft = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      }
    } catch {
      // keep demo data as fallback
    }
  }

  async function loadTasksData() {
    try {
      const [upcoming, completion] = await Promise.all([
        tasksService.getUpcoming(eventId.value),
        tasksService.getCompletionPercent(eventId.value)
      ]);

      if (Array.isArray(upcoming)) {
        overview.value.tasks = upcoming.map((t) => ({
          id: t.id,
          title: t.title,
          note: t.description || "",
          due: formatDue(t.dueDate)
        }));
      }

      if (completion && typeof completion.completionPercent === "number") {
        overview.value.progress = completion.completionPercent;
        overview.value.progressMessage = `You have completed ${completion.completionPercent}% of your tasks.`;
      }
    } catch {
      // keep demo data as fallback
    }
  }

  async function loadStatusCounts() {
    try {
      const counts = await guestsService.getStatusCounts(eventId.value);
      const comming = counts.comming || 0;
      const maybe = counts.maybe || 0;
      const decline = counts.decline || 0;
      const waiting = counts.waiting || 0;
      overview.value.rsvp = {
        total: comming + maybe + decline + waiting,
        comming,
        maybe,
        decline,
        waiting
      };
    } catch {
      // keep demo data as fallback
    }
  }

  async function loadGuestCount() {
    try {
      const data = await guestsService.getCount(eventId.value);
      const total = Number(data.total || 0);
      const adults = Number(data.adults || 0);
      const children = Number(data.children || 0);
      overview.value.totalGuests = total;
      overview.value.guestsMeta = [
        { label: "Adults", value: adults },
        { label: "Children", value: children }
      ];
    } catch {
      // keep demo data as fallback
    }
  }

  async function loadBudgetSummary() {
    try {
      const list = await budgetsService.list(eventId.value);
      const data = Array.isArray(list) ? list[0] : list;
      if (!data) {
        overview.value.budget = { currency: "EUR", total: 0, used: 0, remaining: 0, items: [] };
        return;
      }
      const amount = Number(data.amount || 0);
      const remainAmount = Number(data.remainAmount || 0);
      const used = amount - remainAmount;
      overview.value.budget = {
        currency: data.currency || "EUR",
        total: amount,
        used,
        remaining: remainAmount,
        items: (data.expensesByCategory || []).map((c) => ({
          name: c.category,
          used: Number(c.totalAmount || 0),
          limit: Number(c.totalAmount || 0)
        }))
      };
    } catch {
      // keep demo data as fallback
    }
  }

  async function loadTablesSummary() {
    try {
      const list = await tablesService.getTables(eventId.value);
      const tables = Array.isArray(list) ? list : [];
      overview.value.tablesTotal = tables.length;
      overview.value.tablesAssigned = tables.filter(t => (t.assignedGuests || 0) >= (t.maxGuest || 1)).length;
      overview.value.assignedGuests = tables.reduce((sum, t) => sum + (t.assignedGuests || 0), 0);
      overview.value.totalGuestsForTables = tables.reduce((sum, t) => sum + (t.maxGuest || 0), 0);
    } catch {
      // keep demo data as fallback
    }
  }

  async function loadGalleryPreview() {
    try {
      const data = await mediaService.list(eventId.value, { page: 0, size: 6 });
      const list = Array.isArray(data)
        ? data
        : (data?.content && Array.isArray(data.content)) ? data.content : [];
      overview.value.galleryImages = list;
    } catch {
      overview.value.galleryImages = [];
    }
  }

  onMounted(() => {
    loadEvent();
    loadTasksData();
    loadStatusCounts();
    loadGuestCount();
    loadBudgetSummary();
    loadTablesSummary();
    loadGalleryPreview();
  });

  return {
    event,
    overview
  };
}

function formatDue(raw) {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    const now = new Date();
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Due Today";
    if (diff === 1) return "Due Tomorrow";
    if (diff < 0) return "Overdue";
    return `Due in ${diff} days`;
  } catch {
    return raw;
  }
}
