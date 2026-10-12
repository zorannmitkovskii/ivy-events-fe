<template>
  <div v-if="draftWaiting" class="draft-auth-notice" role="note" data-testid="draft-auth-notice">
    <p class="draft-auth-notice__text">{{ $t('auth.draftNotice.text') }}</p>
    <RouterLink class="draft-auth-notice__link" :to="backTo">
      {{ $t('auth.draftNotice.back') }}
    </RouterLink>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { hasPendingDraft, pendingDraftDesign } from "@/composables/useDraftSync";

/**
 * On sign-up and sign-in, when the person arrived with an invitation built as
 * a guest (INV-104): says plainly that it is only in this browser until the
 * account exists, and offers the way back to it — leaving here keeps it.
 */
const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

const draftWaiting = hasPendingDraft();
const backTo = computed(() => ({
  path: `/${lang.value}/invitations/${pendingDraftDesign()}`,
  query: { edit: "true", new: "1" },
}));
</script>

<style scoped>
.draft-auth-notice {
  display: grid;
  gap: 6px;
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f0f9ff;
  border: 1px solid #b9e6fe;
  color: #026aa2;
  font-size: 13px;
}

.draft-auth-notice__text {
  margin: 0;
  line-height: 1.45;
}

.draft-auth-notice__link {
  justify-self: start;
  font-weight: 600;
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
