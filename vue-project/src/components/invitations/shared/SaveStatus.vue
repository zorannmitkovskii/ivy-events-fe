<template>
  <div
    class="save-status"
    :class="['save-status--' + status, { 'save-status--idle': !message }]"
    data-testid="save-status"
    :data-status="status"
  >
    <!-- Always rendered: a live region has to exist before its text changes to be announced. -->
    <span v-if="message" class="save-status__dot" aria-hidden="true"></span>
    <span class="save-status__text" role="status" aria-live="polite">{{ message }}</span>
    <button
      v-if="canRetry"
      type="button"
      class="save-status__retry"
      data-testid="save-status-retry"
      @click="emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

/**
 * What the invitation editor knows about the last save (IVY-INV-301).
 * "Saved to your account" is only ever shown for `synced`, which the editor
 * sets after the server confirmed the save.
 */
const props = defineProps({
  status: { type: String, default: "idle" },
  detail: { type: String, default: null },
  lastSyncedAt: { type: Date, default: null },
});

const emit = defineEmits(["retry"]);
const { t, locale } = useI18n();

const message = computed(() => {
  switch (props.status) {
    case "saving":
      return t("editSection.saveStatus.saving");
    case "local":
      if (props.detail === "previous") return t("editSection.saveStatus.localPrevious");
      if (props.detail === "notCreated") return t("editSection.saveStatus.localNotCreated");
      return t("editSection.saveStatus.localGuest");
    case "synced": {
      if (!props.lastSyncedAt) return t("editSection.saveStatus.synced");
      let time = "";
      try {
        time = props.lastSyncedAt.toLocaleTimeString(locale.value, { hour: "2-digit", minute: "2-digit" });
      } catch { /* unsupported locale — no time */ }
      return time ? t("editSection.saveStatus.syncedAt", { time }) : t("editSection.saveStatus.synced");
    }
    case "offline":
      return t("editSection.saveStatus.offline");
    case "error":
      // INV-402: held back — a section could not be read, and saving now
      // would erase it on the server.
      if (props.detail === "sectionsNotLoaded") return t("editSection.saveStatus.sectionsNotLoaded");
      return t("editSection.saveStatus.error");
    default:
      return "";
  }
});

const retryLabel = computed(() => {
  if (props.status === "local") return t("editSection.saveStatus.sync");
  if (props.detail === "sectionsNotLoaded") return t("editSection.saveStatus.reload");
  return t("editSection.saveStatus.retry");
});

const canRetry = computed(
  () => props.status === "error" || props.status === "offline" || (props.status === "local" && props.detail === "previous")
);
</script>

<style scoped>
.save-status {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 12px;
  line-height: 1.3;
  color: var(--ink-3, #4b5563);
}

.save-status__dot {
  flex: 0 0 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
}

.save-status--saving .save-status__dot { background: #f59e0b; }
.save-status--local .save-status__dot { background: #6366f1; }
.save-status--synced .save-status__dot { background: #059669; }
.save-status--offline .save-status__dot { background: #d97706; }
.save-status--error .save-status__dot { background: #dc2626; }
.save-status--error .save-status__text { color: #b91c1c; }

.save-status__text {
  min-width: 0;
}

.save-status__retry {
  flex: 0 0 auto;
  padding: 3px 8px;
  border: 1px solid currentColor;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.save-status__retry:focus-visible {
  outline: 2px solid #059669;
  outline-offset: 2px;
}
</style>
