<template>
  <div class="draft-notices" :class="{ 'draft-notices--editor': editor }">
    <div v-if="failed" class="draft-notice draft-notice--error" role="alert" data-testid="draft-notice-failed">
      <p>{{ t('editSection.resume.failed') }}</p>
      <button type="button" class="draft-notice__btn" :disabled="busy" @click="emit('retry')">
        {{ t('editSection.saveStatus.retry') }}
      </button>
    </div>
    <div v-if="photos > 0" class="draft-notice" role="status" data-testid="draft-notice-photos">
      <p>{{ t('editSection.resume.photos', { count: photos }, photos) }}</p>
      <button type="button" class="draft-notice__btn" @click="emit('dismiss-photos')">
        {{ t('editSection.resume.photosOk') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";

/**
 * What the invitation editor has to tell somebody coming back from sign-in
 * (INV-104). Never a silent outcome: a create that failed, photos that have
 * to be picked again. The guest preview has its own bar (GuestPreviewBar,
 * INV-602).
 */
defineProps({
  failed: { type: Boolean, default: false },
  photos: { type: Number, default: 0 },
  busy: { type: Boolean, default: false },
  editor: { type: Boolean, default: false },
});

const emit = defineEmits(["retry", "dismiss-photos"]);
const { t } = useI18n();
</script>

<style scoped>
.draft-notices {
  position: fixed;
  left: 50%;
  top: 12px;
  transform: translateX(-50%);
  z-index: 1500;
  display: grid;
  gap: 8px;
  width: min(560px, calc(100vw - 32px));
}

.draft-notices:empty {
  display: none;
}

.draft-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(16, 24, 40, 0.12);
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.15);
  font-size: 14px;
  color: var(--ink, #101828);
}

.draft-notice p {
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

.draft-notice--error {
  border-color: rgba(180, 35, 24, 0.35);
  background: #fef3f2;
}

.draft-notice__btn {
  flex-shrink: 0;
  min-height: 40px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(16, 24, 40, 0.15);
  background: #fff;
  color: var(--ink, #101828);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.draft-notice__btn:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .draft-notice {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
