<template>
  <section>
    <header class="page-head">
      <div>
        <h1>{{ t('vendorPortal.floorPlans') }}</h1>
        <p class="subtitle">{{ t('vendorPortal.floorPlansSubtitle') }}</p>
      </div>
      <button class="btn-primary" @click="startNew">{{ t('vendorPortal.newFloorPlan') }}</button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="draft" class="editor">
      <label class="field">
        {{ t('vendorPortal.floorPlanName') }}
        <input v-model="draft.name" required />
      </label>

      <p class="seats-total">
        {{ t('vendorPortal.seatsTotal') }}: <strong>{{ seatTotal }}</strong>
      </p>

      <ul class="tables">
        <li v-for="(table, index) in draft.tables" :key="index" class="table-row">
          <input v-model="table.label" :placeholder="t('vendorPortal.tableLabel')" class="label-input" />
          <input v-model.number="table.seats" type="number" min="1" class="seats-input" />
          <select v-model="table.shape" class="shape-input">
            <option v-for="shape in SHAPES" :key="shape" :value="shape">
              {{ t(`vendorPortal.shape.${shape}`) }}
            </option>
          </select>
          <button class="btn-icon" :title="t('vendorPortal.remove')" @click="draft.tables.splice(index, 1)">
            ×
          </button>
        </li>
      </ul>

      <div class="editor-actions">
        <button class="btn-secondary" @click="addTable">{{ t('vendorPortal.addTable') }}</button>
        <button class="btn-secondary" @click="addRow">{{ t('vendorPortal.addTenTables') }}</button>
        <span class="spacer"></span>
        <button class="btn-secondary" @click="draft = null">{{ t('vendorPortal.cancel') }}</button>
        <button class="btn-primary" :disabled="saving" @click="save">{{ t('vendorPortal.save') }}</button>
      </div>
    </div>

    <ul class="plan-list">
      <li v-for="plan in plans" :key="plan.id" class="plan">
        <div class="plan-head">
          <h3>{{ plan.name }}</h3>
          <span class="capacity">
            {{ plan.tables.length }} {{ t('vendorPortal.tables') }} ·
            {{ plan.capacity }} {{ t('vendorPortal.seats') }}
          </span>
        </div>

        <!-- A plain grid, not a canvas: what a venue needs first is the list
             of tables and their seats. Dragging them into position is worth
             building only once someone asks for it. -->
        <div class="table-grid">
          <div v-for="table in plan.tables" :key="table.id" class="table-chip" :class="table.shape.toLowerCase()">
            <span class="chip-label">{{ table.label }}</span>
            <span class="chip-seats">{{ table.seats }}</span>
          </div>
        </div>

        <div class="plan-actions">
          <button class="btn-secondary" @click="startEdit(plan)">{{ t('vendorPortal.edit') }}</button>
          <button class="btn-danger" @click="remove(plan)">{{ t('vendorPortal.remove') }}</button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { vendorPortalService } from "@/services/vendorPortal.service";

const { t } = useI18n();

const SHAPES = ["ROUND", "RECTANGLE", "SQUARE"];
const DEFAULT_SEATS = 8;

const plans = ref([]);
const draft = ref(null);
const editingId = ref(null);
const error = ref(null);
const saving = ref(false);

const seatTotal = computed(() =>
  (draft.value?.tables ?? []).reduce((sum, table) => sum + (Number(table.seats) || 0), 0)
);

async function load() {
  try {
    const { data } = await vendorPortalService.listFloorPlans();
    plans.value = data;
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message;
  }
}

function startNew() {
  editingId.value = null;
  draft.value = { name: "", active: true, tables: [] };
}

function startEdit(plan) {
  editingId.value = plan.id;
  draft.value = {
    name: plan.name,
    active: plan.active,
    tables: plan.tables.map((table) => ({
      label: table.label,
      seats: table.seats,
      shape: table.shape
    }))
  };
}

function addTable() {
  draft.value.tables.push({ label: nextLabel(), seats: DEFAULT_SEATS, shape: "ROUND" });
}

/**
 * Rooms are laid out in tens, and typing forty tables one at a time is the
 * fastest way to make a venue give up on the screen.
 */
function addRow() {
  for (let i = 0; i < 10; i += 1) {
    addTable();
  }
}

function nextLabel() {
  const numbers = draft.value.tables
    .map((table) => Number.parseInt(table.label, 10))
    .filter((value) => !Number.isNaN(value));
  return String(numbers.length ? Math.max(...numbers) + 1 : 1);
}

async function save() {
  saving.value = true;
  error.value = null;
  try {
    if (editingId.value) {
      await vendorPortalService.updateFloorPlan(editingId.value, draft.value);
    } else {
      await vendorPortalService.createFloorPlan(draft.value);
    }
    draft.value = null;
    await load();
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message;
  } finally {
    saving.value = false;
  }
}

async function remove(plan) {
  try {
    await vendorPortalService.deleteFloorPlan(plan.id);
    await load();
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message;
  }
}

onMounted(load);
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

h1 {
  font-size: 1.2rem;
  margin: 0;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #6b665e;
  font-size: 0.9rem;
}

.editor,
.plan {
  background: #fff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.field {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
  color: #6b665e;
}

input,
select {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  padding: 0.5rem 0.625rem;
  min-height: 44px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  font: inherit;
}

.seats-total {
  color: #6b665e;
  font-size: 0.9rem;
}

.tables,
.plan-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.table-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.label-input {
  width: 8rem;
  margin-top: 0;
}

.seats-input {
  width: 6rem;
  margin-top: 0;
}

.shape-input {
  width: 10rem;
  margin-top: 0;
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1rem;
}

.spacer {
  flex: 1;
}

.plan-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}

.plan-head h3 {
  margin: 0;
  font-size: 1rem;
}

.capacity {
  color: #6b665e;
  font-size: 0.85rem;
}

.table-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

.table-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: #f4f1ea;
  border: 1px solid #e8e4dc;
}

.table-chip.round {
  border-radius: 50%;
}

.table-chip.rectangle {
  border-radius: 6px;
  width: 76px;
}

.table-chip.square {
  border-radius: 6px;
}

.chip-label {
  font-weight: 600;
  font-size: 0.85rem;
}

.chip-seats {
  font-size: 0.7rem;
  color: #6b665e;
}

.plan-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  min-height: 44px;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
}

.btn-primary {
  background: #1f3d2b;
  border: none;
  color: #fff;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #e8e4dc;
}

.btn-danger {
  background: transparent;
  border: 1px solid #a4292c;
  color: #a4292c;
}

.btn-icon {
  border: 1px solid #e8e4dc;
  background: transparent;
  border-radius: 8px;
  width: 44px;
  min-height: 44px;
  cursor: pointer;
  font-size: 1.1rem;
}

.error {
  color: #a4292c;
}
</style>
