import { ref, computed, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { useAuthUser } from "@/composables/useAuthUser";
import { agendaService } from "@/services/agenda.service";
import { getDemoAgenda } from "@/demo/agenda.demo";

export function useAgenda() {
  const route = useRoute();
  const { eventId } = useAuthUser();

  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const selectedId = ref(null);
  const drawerOpen = ref(false);

  // simple date (you can replace with date picker later)
  const date = ref("2024-10-24");

  const isDemo = computed(() => String(route.query.demo || "") === "1" || eventId.value === "demo");

  const items = computed(() => data.value?.items || []);
  const selectedItem = computed(() => items.value.find((x) => x.id === selectedId.value) || null);

  // editable form model
  const form = ref({
    title: "",
    start: "",
    end: "",
    location: "",
    responsible: "",
    visibility: "everyone",
    notes: "",
    status: "upcoming"
  });

  function openEdit(item) {
    selectedId.value = item.id;
    form.value = {
      title: item.title || "",
      start: item.start || "",
      end: item.end || "",
      location: item.location || "",
      responsible: item.responsible || "",
      visibility: item.visibility || "everyone",
      notes: item.notes || "",
      status: item.status || "upcoming"
    };
    drawerOpen.value = true;
  }

  function closeEdit() {
    drawerOpen.value = false;
    selectedId.value = null;
  }

  const run = async () => {
    loading.value = true;
    error.value = null;

    try {
      if (isDemo.value) {
        data.value = getDemoAgenda(eventId.value);
        return;
      }
      data.value = await agendaService.list(eventId.value, date.value);
    } catch (e) {
      // fallback to demo for client presentation
      data.value = getDemoAgenda("demo");
      error.value = e?.message || "Failed to load agenda";
    } finally {
      loading.value = false;
    }
  };

  watchEffect(() => {
    if (eventId.value) run();
  });

  // mutations
  const save = async () => {
    if (!selectedId.value) return;

    if (isDemo.value) {
      const idx = data.value.items.findIndex((x) => x.id === selectedId.value);
      if (idx >= 0) {
        data.value.items[idx] = { ...data.value.items[idx], ...form.value };
      }
      closeEdit();
      return;
    }

    await agendaService.update(eventId.value, selectedId.value, { ...form.value });
    await run();
    closeEdit();
  };

  const remove = async () => {
    if (!selectedId.value) return;

    if (isDemo.value) {
      data.value.items = data.value.items.filter((x) => x.id !== selectedId.value);
      closeEdit();
      return;
    }

    await agendaService.remove(eventId.value, selectedId.value);
    await run();
    closeEdit();
  };

  const addNew = () => {
    // create a new local draft (demo), or open drawer with empty fields
    selectedId.value = "__new__";
    form.value = {
      title: "",
      start: "18:00",
      end: "18:30",
      location: "",
      responsible: "",
      visibility: "everyone",
      notes: "",
      status: "upcoming"
    };
    drawerOpen.value = true;
  };

  const create = async () => {
    if (selectedId.value !== "__new__") return;

    if (isDemo.value) {
      const newItem = { id: `a_${Date.now()}`, ...form.value };
      data.value.items = [...data.value.items, newItem].sort((a, b) => a.start.localeCompare(b.start));
      closeEdit();
      return;
    }

    await agendaService.create(eventId.value, { ...form.value, date: date.value });
    await run();
    closeEdit();
  };

  return {
    data,
    items,
    date,
    loading,
    error,
    run,
    isDemo,
    drawerOpen,
    selectedItem,
    form,
    openEdit,
    closeEdit,
    addNew,
    save,
    create,
    remove
  };
}
