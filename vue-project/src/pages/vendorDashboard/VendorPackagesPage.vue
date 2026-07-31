<template>
  <section>
    <header class="page-head">
      <div>
        <h1>{{ t('vendorPortal.packages') }}</h1>
        <p class="subtitle">{{ t('vendorPortal.packagesSubtitle') }}</p>
      </div>
      <button class="btn-primary" @click="startNew">{{ t('vendorPortal.newPackage') }}</button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="draft" class="editor">
      <label class="field">
        {{ t('vendorPortal.packageName') }}
        <input v-model="draft.name" required />
      </label>

      <label class="field">
        {{ t('vendorPortal.description') }}
        <textarea v-model="draft.description" rows="2"></textarea>
      </label>

      <div class="field-row">
        <label class="field">
          {{ t('vendorPortal.pricePerPerson') }}
          <input v-model.number="draft.pricePerPerson" type="number" min="0" step="10" />
        </label>
        <label class="field">
          {{ t('vendorPortal.minGuests') }}
          <input v-model.number="draft.minGuests" type="number" min="1" />
        </label>
      </div>

      <h2 class="items-title">{{ t('vendorPortal.items') }}</h2>
      <ul class="items">
        <li v-for="(item, index) in draft.items" :key="index" class="item-row">
          <select v-model="item.course" class="course">
            <option v-for="course in COURSES" :key="course" :value="course">
              {{ t(`vendorPortal.course.${course}`) }}
            </option>
          </select>
          <input v-model="item.name" :placeholder="t('vendorPortal.itemName')" class="item-name" />
          <button class="btn-icon" :title="t('vendorPortal.remove')" @click="draft.items.splice(index, 1)">
            ×
          </button>
        </li>
      </ul>

      <div class="editor-actions">
        <button class="btn-secondary" @click="addItem">{{ t('vendorPortal.addItem') }}</button>
        <span class="spacer"></span>
        <button class="btn-secondary" @click="draft = null">{{ t('vendorPortal.cancel') }}</button>
        <button class="btn-primary" :disabled="saving" @click="save">{{ t('vendorPortal.save') }}</button>
      </div>
    </div>

    <ul class="package-list">
      <li v-for="pkg in packages" :key="pkg.id" class="package">
        <div class="package-head">
          <h3>{{ pkg.name }}</h3>
          <span v-if="pkg.pricePerPerson" class="price">
            {{ pkg.pricePerPerson }} {{ pkg.currency }} / {{ t('vendorPortal.person') }}
          </span>
        </div>
        <p v-if="pkg.description" class="package-description">{{ pkg.description }}</p>
        <ul class="package-items">
          <li v-for="item in pkg.items" :key="item.id">
            <span class="course-label">{{ t(`vendorPortal.course.${item.course}`) }}</span>
            {{ item.name }}
          </li>
        </ul>
        <div class="package-actions">
          <button class="btn-secondary" @click="startEdit(pkg)">{{ t('vendorPortal.edit') }}</button>
          <button class="btn-danger" @click="remove(pkg)">{{ t('vendorPortal.remove') }}</button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { vendorPortalService } from "@/services/vendorPortal.service";

const { t } = useI18n();

const COURSES = ["WELCOME", "APPETIZER", "SOUP", "MAIN", "SIDE", "DESSERT", "DRINK", "OTHER"];

const packages = ref([]);
const draft = ref(null);
const editingId = ref(null);
const error = ref(null);
const saving = ref(false);

async function load() {
  try {
    const { data } = await vendorPortalService.listPackages();
    packages.value = data;
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message;
  }
}

function startNew() {
  editingId.value = null;
  draft.value = {
    name: "",
    description: "",
    pricePerPerson: null,
    currency: "MKD",
    minGuests: null,
    active: true,
    items: []
  };
}

function startEdit(pkg) {
  editingId.value = pkg.id;
  // Copied rather than bound to the list, so cancelling leaves the card as it
  // was instead of showing half-typed edits.
  draft.value = {
    name: pkg.name,
    description: pkg.description,
    pricePerPerson: pkg.pricePerPerson,
    currency: pkg.currency,
    minGuests: pkg.minGuests,
    active: pkg.active,
    items: pkg.items.map((item) => ({
      course: item.course,
      name: item.name,
      description: item.description
    }))
  };
}

function addItem() {
  draft.value.items.push({ course: "MAIN", name: "", description: "" });
}

async function save() {
  saving.value = true;
  error.value = null;
  try {
    // Order is the order on screen: the owner arranged the courses, and the
    // guest view reads them the same way.
    const payload = {
      ...draft.value,
      items: draft.value.items.map((item, index) => ({ ...item, sortOrder: index }))
    };
    if (editingId.value) {
      await vendorPortalService.updatePackage(editingId.value, payload);
    } else {
      await vendorPortalService.createPackage(payload);
    }
    draft.value = null;
    await load();
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message;
  } finally {
    saving.value = false;
  }
}

async function remove(pkg) {
  try {
    await vendorPortalService.deletePackage(pkg.id);
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

.editor {
  background: #fff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.field {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
  color: #6b665e;
}

.field-row {
  display: flex;
  gap: 1rem;
}

.field-row .field {
  flex: 1;
}

input,
textarea,
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

.items-title {
  font-size: 0.95rem;
  margin: 1rem 0 0.5rem;
}

.items,
.package-items,
.package-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.item-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.course {
  width: 10rem;
  margin-top: 0;
}

.item-name {
  flex: 1;
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

.package {
  background: #fff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.package-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}

.package-head h3 {
  margin: 0;
  font-size: 1rem;
}

.price {
  font-weight: 600;
  white-space: nowrap;
}

.package-description {
  color: #6b665e;
  font-size: 0.9rem;
  margin: 0.25rem 0 0.5rem;
}

.package-items li {
  padding: 0.125rem 0;
  font-size: 0.9rem;
}

.course-label {
  display: inline-block;
  min-width: 7rem;
  color: #6b665e;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.package-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
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
