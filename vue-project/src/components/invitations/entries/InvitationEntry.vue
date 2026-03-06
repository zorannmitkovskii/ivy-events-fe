<template>
  <component
    :is="entryComponent"
    ref="innerRef"
    v-bind="$attrs"
    @enter="$emit('enter')"
    @fading="$emit('fading')"
  >
    <template #edit-button>
      <div @click.stop>
        <SectionEditButton
          :visible="isEditMode"
          :label="editLabel"
          variant="dark"
          @click="$emit('edit')"
        />
      </div>
    </template>
  </component>
</template>

<script setup>
import { computed, ref, defineAsyncComponent } from 'vue';
import SectionEditButton from '@/components/invitations/shared/SectionEditButton.vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  type: { type: String, required: true },
  design: { type: String, required: true },
  isEditMode: { type: Boolean, default: false },
  editLabel: { type: String, default: '' },
});

defineEmits(['enter', 'fading', 'edit']);

const ENTRY_REGISTRY = {
  'envelop/classic': () => import('./envelop/ClassicEnvelopEntry.vue'),
  'envelop/airmail': () => import('./envelop/AirmailEnvelopEntry.vue'),
  'heart/bloom': () => import('./heart/HeartBloomEntry.vue'),
  'heart/pulse': () => import('./heart/HeartPulseEntry.vue'),
  'gallery/collage': () => import('./gallery/CollageEntry.vue'),
  'gallery/polaroid': () => import('./gallery/PolaroidEntry.vue'),
  'wax/seal': () => import('./wax/WaxSealEntry.vue'),
  'wax/melt': () => import('./wax/WaxMeltEntry.vue'),
  'door/doors': () => import('./door/DoubleDoorEntry.vue'),
  'door/curtain': () => import('./door/CurtainEntry.vue'),
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

defineExpose({
  enterSite: () => innerRef.value?.enterSite(),
});
</script>
