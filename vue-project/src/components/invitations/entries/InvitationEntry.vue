<template>
  <component
    :is="entryComponent"
    ref="innerRef"
    v-bind="$attrs"
    @enter="emit('enter')"
    @fading="emit('fading')"
  >
    <template #edit-button>
      <div @click.stop>
        <SectionEditButton
          :visible="isEditMode"
          :label="editLabel"
          variant="dark"
          @click="emit('edit')"
        />
      </div>
    </template>
  </component>
</template>

<script setup>
import { computed, ref, watch, provide, defineAsyncComponent } from 'vue';
import SectionEditButton from '@/components/invitations/shared/SectionEditButton.vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  type: { type: String, required: true },
  design: { type: String, required: true },
  visible: { type: Boolean, default: true },
  isEditMode: { type: Boolean, default: false },
  editLabel: { type: String, default: '' },
});

const emit = defineEmits(['enter', 'fading', 'edit']);

// Provide design key so child entries (e.g. VideoEntry) can read it
provide('entryDesign', computed(() => props.design));

const videoLoader = () => import('./videos/VideoEntry.vue');

const ENTRY_REGISTRY = {
  // Envelope
  'envelop/blue-red-seal': videoLoader,
  'envelop/white-blue-seal': videoLoader,
  'envelop/white-gold-seal': videoLoader,
  'envelop/red-blue-seal': videoLoader,
  'envelop/blue-blue-seal': videoLoader,
  // Heart
  'heart/bloom': () => import('./heart/HeartBloomEntry.vue'),
  'heart/pulse': () => import('./heart/HeartPulseEntry.vue'),
  // Gallery
  'gallery/collage': () => import('./gallery/CollageEntry.vue'),
  'gallery/polaroid': () => import('./gallery/PolaroidEntry.vue'),
  // Wax
  'wax/seal': () => import('./wax/WaxSealEntry.vue'),
  'wax/melt': () => import('./wax/WaxMeltEntry.vue'),
  // Door
  'door/baroque-doors': videoLoader,
  'door/rustic-doors': videoLoader,
  'door/white-doors': videoLoader,
  'door/french-doors': videoLoader,
  'door/red-curtain': videoLoader,
  'door/red-curtain-dark': videoLoader,
};

// Pre-build async components so each key is only created once
const ENTRY_COMPONENTS = Object.fromEntries(
  Object.entries(ENTRY_REGISTRY).map(([key, loader]) => [
    key,
    defineAsyncComponent(loader),
  ])
);

const innerRef = ref(null);

const entryComponent = computed(() => {
  const key = `${props.type}/${props.design}`;
  return ENTRY_COMPONENTS[key] || null;
});

// If entry type/design is invalid, skip the entry overlay
watch(
  () => entryComponent.value,
  (comp) => {
    if (!comp && props.visible) emit('enter');
  },
  { immediate: true },
);

defineExpose({
  enterSite: () => innerRef.value?.enterSite(),
});
</script>
