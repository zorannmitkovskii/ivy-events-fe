<template>
  <BaseModal :open="open" title="Edit Entry" @close="emit('close')">
    <div class="entry-modal">
      <!-- Type selector -->
      <label class="field-label">Type</label>
      <select v-model="selectedType" class="field-select">
        <option v-for="(info, key) in ENTRY_TYPES" :key="key" :value="key">
          {{ info.label }}
        </option>
      </select>

      <!-- Design selector -->
      <label class="field-label">Design</label>
      <template v-for="(group, gi) in designGroups" :key="gi">
        <p v-if="group.label" class="group-label">{{ group.label }}</p>
        <div class="design-grid">
          <button
            v-for="d in group.items"
            :key="d.key"
            type="button"
            class="design-card"
            :class="{ 'design-card--active': selectedDesign === d.key }"
            @click="selectedDesign = d.key"
          >
            {{ d.label }}
          </button>
        </div>
      </template>
    </div>

    <template v-if="!liveEdit" #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">
        Cancel
      </ButtonMain>
      <ButtonMain variant="main" type="button" @click="onSave">
        Save
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import BaseModal from '@/components/ui/BaseModal.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';

const ENTRY_TYPES = {
  envelop: {
    label: 'Envelope',
    designs: [
      { key: 'blue-red-seal', label: 'Blue / Red Seal' },
      { key: 'white-blue-seal', label: 'White / Blue Seal' },
      { key: 'white-gold-seal', label: 'White / Gold Seal' },
      { key: 'red-blue-seal', label: 'Red / Blue Seal' },
      { key: 'blue-blue-seal', label: 'Blue / Blue Seal' },
    ],
  },
  heart: {
    label: 'Heart',
    designs: [
      { key: 'bloom', label: 'Bloom' },
      { key: 'pulse', label: 'Pulse' },
    ],
  },
  gallery: {
    label: 'Gallery',
    designs: [
      { key: 'collage', label: 'Collage' },
      { key: 'polaroid', label: 'Polaroid' },
    ],
  },
  wax: {
    label: 'Wax Seal',
    designs: [
      { key: 'seal', label: 'Seal' },
      { key: 'melt', label: 'Melt' },
    ],
  },
  door: {
    label: 'Door & Curtain',
    designs: [
      { key: 'baroque-doors', label: 'Golden Baroque Doors' },
      { key: 'rustic-doors', label: 'Rustic Wooden Doors' },
      { key: 'white-doors', label: 'White Wooden Doors' },
      { key: 'french-doors', label: 'French Double Doors' },
      { key: 'red-curtain', label: 'Red Velvet Curtains' },
      { key: 'red-curtain-dark', label: 'Red Velvet Curtains (Dark)' },
    ],
  },
};

const props = defineProps({
  open: { type: Boolean, default: false },
  currentType: { type: String, default: 'envelop' },
  currentDesign: { type: String, default: 'classic' },
  liveEdit: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'save', 'change']);

const selectedType = ref(props.currentType);
const selectedDesign = ref(props.currentDesign);

const currentDesigns = computed(() => {
  return ENTRY_TYPES[selectedType.value]?.designs || [];
});

// Group designs by their `group` field (if present), else single group
const designGroups = computed(() => {
  const designs = currentDesigns.value;
  if (!designs.some((d) => d.group)) {
    return [{ label: '', items: designs }];
  }
  const groups = [];
  let current = null;
  for (const d of designs) {
    if (!current || current.label !== (d.group || '')) {
      current = { label: d.group || '', items: [] };
      groups.push(current);
    }
    current.items.push(d);
  }
  return groups;
});

// Reset design when type changes (pick first available)
watch(selectedType, (newType, oldType) => {
  if (newType !== oldType) {
    const designs = ENTRY_TYPES[newType]?.designs;
    if (designs?.length) {
      selectedDesign.value = designs[0].key;
    }
  }
});

// Sync with props when modal opens
watch(() => props.open, (v) => {
  if (v) {
    selectedType.value = props.currentType;
    selectedDesign.value = props.currentDesign;
  }
}, { immediate: true });

// Emit change in live-edit mode
watch([selectedType, selectedDesign], () => {
  if (props.liveEdit) {
    emit('change', { type: selectedType.value, design: selectedDesign.value });
  }
});

function onSave() {
  emit('save', { type: selectedType.value, design: selectedDesign.value });
}
</script>

<style scoped>
.entry-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.field-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
  background: #fff;
  outline: none;
  transition: border-color 0.2s;
}

.field-select:focus {
  border-color: var(--brand-main, #6b7280);
}

.group-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 8px 0 4px;
}

.design-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.design-card {
  padding: 14px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s, background 0.2s;
}

.design-card:hover {
  border-color: #9ca3af;
}

.design-card--active {
  border-color: var(--brand-main, #374151);
  background: #f9fafb;
  font-weight: 600;
}
</style>
