<template>
  <DashboardToolbar>
    <template v-if="hasItems" #actions>
      <ButtonMain variant="outline" @click="$emit('addImages')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        {{ imagesLabel }}
      </ButtonMain>
      <ButtonMain variant="main" @click="$emit('add')">
        + {{ addLabel }}
      </ButtonMain>
    </template>
  </DashboardToolbar>
</template>

<script setup>
import ButtonMain from "@/components/generic/ButtonMain.vue";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar.vue";

defineProps({
  addLabel: { type: String, required: true },
  imagesLabel: { type: String, required: true },
  hasItems: { type: Boolean, default: false }
});

defineEmits(["add", "addImages"]);
</script>
