<template>
  <DashboardToolbar>
    <template v-if="hasItems" #actions>
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
  hasItems: { type: Boolean, default: false }
});

defineEmits(["add"]);
</script>
