<template>
  <div class="editor-mode" data-testid="editor-mode">
    <div class="editor-mode__switch" role="group" :aria-label="t('editSection.editorMode.label')">
      <button
        v-for="m in MODES"
        :key="m"
        type="button"
        class="editor-mode__btn"
        :class="{ 'editor-mode__btn--active': mode === m }"
        :aria-pressed="mode === m ? 'true' : 'false'"
        :aria-describedby="hintId"
        :data-mode="m"
        @click="mode !== m && emit('change', m)"
      >
        <svg v-if="mode === m" class="editor-mode__check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        {{ t('editSection.editorMode.' + m) }}
      </button>
    </div>
    <p :id="hintId" class="editor-mode__hint">{{ t('editSection.editorMode.' + mode + 'Hint') }}</p>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { EDITOR_MODES } from "@/composables/useEditorMode";

// INV-103: the one switch between the quick start and the advanced settings,
// the same on the desktop sidebar and in the phone sheet.
defineProps({
  mode: { type: String, default: EDITOR_MODES.QUICK },
});
const emit = defineEmits(["change"]);
const { t } = useI18n();

const MODES = [EDITOR_MODES.QUICK, EDITOR_MODES.ADVANCED];
// Two instances can be mounted at once (sidebar + sheet): ids must differ.
const hintId = `editor-mode-hint-${Math.random().toString(36).slice(2, 9)}`;
</script>

<style scoped>
.editor-mode {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.editor-mode__switch {
  display: flex;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--sunken, #f3f4f6);
}

.editor-mode__btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-3);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.editor-mode__btn:hover {
  color: var(--ink);
}

.editor-mode__btn:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 1px;
}

.editor-mode__btn--active {
  background: #fff;
  border-color: var(--line-2);
  color: var(--ink);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.editor-mode__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ink-3);
}
</style>
