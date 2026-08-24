<template>
  <div class="dash-page">
    <PageHeader :title="t('team.title')" :subtitle="t('team.subtitle')" />

    <div v-if="eventId" class="d-card">
      <CollaboratorsPanel :event-id="eventId" />
    </div>
    <div v-else class="d-card d-card-pad placeholder">
      {{ t("team.noEvent") }}
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import CollaboratorsPanel from "@/components/collaborators/CollaboratorsPanel.vue";
import { onboardingStore } from "@/store/onboarding.store";

const { t } = useI18n();

// No event chosen means there is nothing to invite anyone to. Rendering the
// panel anyway would fire a list call with an empty id, which the backend now
// refuses outright.
const eventId = computed(() => onboardingStore.eventId || "");
</script>

<style scoped>
.d-card {
  background: var(--dash-cream-card);
  border-radius: var(--dash-radius);
  border: 1px solid var(--dash-cream-border);
  box-shadow: var(--dash-shadow-sm);
}
.d-card-pad { padding: 24px; }
.placeholder {
  color: var(--dash-muted);
  font-size: 13px;
  text-align: center;
  padding: 48px 24px;
}
</style>
