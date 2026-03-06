<template>
  <div :class="['inv-layout', { 'inv-layout--split': editMode && isDesktop }]">
    <!-- Left: Invitation Preview -->
    <div
      class="inv-layout__preview"
      :class="{
        'inv-layout__preview--split': editMode && isDesktop,
        'inv-layout__preview--device': isConstrained,
      }"
    >
      <!--
        Single slot position — never moves.
        CSS-only width constraint + device-frame look via wrapper.
        This avoids destroying/recreating slot DOM (which breaks
        IntersectionObserver, position:fixed elements, etc.).
      -->
      <div
        class="preview-frame"
        :class="{
          'preview-frame--edit': editMode && isDesktop,
          'preview-frame--constrained': isConstrained,
          ['preview-frame--' + previewMode]: isConstrained,
        }"
        :style="frameStyle"
        @click="onPreviewClick"
      >
        <slot />
      </div>
    </div>

    <!-- Right: Edit Sidebar (desktop only, edit mode only) -->
    <EditSidebar
      v-if="editMode && isDesktop"
      :sections="sections"
      :active-section="activeSection"
      :dirty="dirty"
      :preview-mode="previewMode"
      :statuses="statuses"
      :section-visibility="sectionVisibility"
      @toggle-section="emit('toggle-section', $event)"
      @toggle-visibility="emit('toggle-visibility', $event)"
      @save="emit('save')"
      @set-preview="emit('set-preview', $event)"
    >
      <!-- Forward info panel slot -->
      <template #info-panel>
        <slot name="info-panel" />
      </template>
      <!-- Forward named slots from parent (with scoped slot data) -->
      <template v-for="s in sections" :key="s.key" #[s.key]="slotProps">
        <slot :name="'section-' + s.key" v-bind="slotProps" />
      </template>
    </EditSidebar>

    <!-- Mobile: floating edit controls + section picker -->
    <template v-if="editMode && !isDesktop">
      <Teleport to="body">
        <!-- Floating buttons (hidden when picker or a modal is open) -->
        <div v-if="!showMobilePicker && !activeSection" class="mobile-edit-controls">
          <button v-if="dirty" class="mobile-fab mobile-fab--save" @click="emit('save')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
          </button>
          <button class="mobile-fab mobile-fab--edit" @click="showMobilePicker = true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
          </button>
        </div>

        <!-- Mobile section picker (bottom sheet) -->
        <Transition name="mobile-sheet">
          <div v-if="showMobilePicker" class="mobile-sheet-overlay" @mousedown.self="showMobilePicker = false">
            <div class="mobile-sheet">
              <div class="mobile-sheet__header">
                <span class="mobile-sheet__title">{{ t('editSection.customize') }}</span>
                <button class="mobile-sheet__close" @click="showMobilePicker = false">&times;</button>
              </div>
              <div class="mobile-sheet__tabs">
                <button
                  class="mobile-tab-btn"
                  :class="{ 'mobile-tab-btn--active': mobileTab === 'info' }"
                  @click="mobileTab = 'info'"
                >
                  {{ t('editSection.info') }}
                </button>
                <button
                  class="mobile-tab-btn"
                  :class="{ 'mobile-tab-btn--active': mobileTab === 'sections' }"
                  @click="mobileTab = 'sections'"
                >
                  {{ t('editSection.sections') }}
                </button>
                <button
                  class="mobile-tab-btn"
                  :class="{ 'mobile-tab-btn--active': mobileTab === 'style' }"
                  @click="mobileTab = 'style'"
                >
                  {{ t('editSection.style') }}
                </button>
              </div>
              <div class="mobile-sheet__body">
                <div v-if="mobileTab === 'info'" class="mobile-info-panel">
                  <slot name="info-panel" />
                </div>
                <button
                  v-for="s in mobileFilteredSections"
                  :key="s.key"
                  class="mobile-sheet__item"
                  @click="onMobileSection(s.key)"
                >
                  <span class="mobile-sheet__icon" v-html="s.icon"></span>
                  <span class="mobile-sheet__label">{{ s.label }}</span>
                  <svg class="mobile-sheet__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              <div v-if="dirty" class="mobile-sheet__footer">
                <button class="mobile-sheet__save" @click="emit('save'); showMobilePicker = false">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  {{ t('editSection.save') }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Render active section modal as overlay on mobile -->
      <template v-for="s in sections" :key="'m-' + s.key">
        <template v-if="activeSection === s.key">
          <slot :name="'section-' + s.key" />
        </template>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useMediaQuery } from "@/composables/useMediaQuery";
import EditSidebar from "@/components/invitations/shared/EditSidebar.vue";

const { t } = useI18n();

const PREVIEW_WIDTHS = { mobile: 375, tablet: 768 };

const props = defineProps({
  editMode: {
    type: Boolean,
    default: false,
  },
  sections: {
    type: Array,
    default: () => [],
  },
  activeSection: {
    type: String,
    default: null,
  },
  dirty: {
    type: Boolean,
    default: false,
  },
  previewMode: {
    type: String,
    default: 'desktop',
  },
  statuses: {
    type: Object,
    default: () => ({}),
  },
  sectionVisibility: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["toggle-section", "toggle-visibility", "save", "set-preview", "select-section"]);

const isDesktop = useMediaQuery("(min-width: 1024px)");
const showMobilePicker = ref(false);
const mobileTab = ref('info');

const mobileFilteredSections = computed(() =>
  props.sections.filter(s => (s.tab || 'sections') === mobileTab.value)
);

const isConstrained = computed(() =>
  props.editMode && props.previewMode !== 'desktop'
);

const targetWidth = computed(() =>
  PREVIEW_WIDTHS[props.previewMode] || 0
);

const frameStyle = computed(() => {
  if (!isConstrained.value) return {};
  return { width: targetWidth.value + 'px' };
});

function onMobileSection(key) {
  showMobilePicker.value = false;
  emit('toggle-section', key);
}

function onPreviewClick(e) {
  if (!props.editMode) return;
  const sectionEl = e.target.closest('[data-edit-section]');
  if (!sectionEl) return;
  const key = sectionEl.dataset.editSection;
  emit('select-section', key);
}
</script>

<style scoped>
.inv-layout--split {
  display: grid;
  grid-template-columns: 70% 30%;
  min-height: 100vh;
}

.inv-layout__preview--split {
  overflow-y: auto;
  height: 100vh;
}

/* When a device preview is active, center the frame on a gray background */
.inv-layout__preview--device {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 16px;
  background: #e5e7eb;
}

/* In split edit mode, contain fixed-positioned children (entry overlays)
   so they stay within the preview column and don't cover the sidebar */
.preview-frame--edit {
  position: relative;
  transform: translateZ(0);
}

/* Preview frame — always wraps the slot */
.preview-frame--constrained {
  border: 12px solid #1f2937;
  border-radius: 36px;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 25px 60px -12px rgba(0, 0, 0, 0.25),
    inset 0 0 0 2px #374151;
  flex-shrink: 0;
  /* contain fixed-positioned children (e.g. entry overlays) */
  transform: translateZ(0);
}

.preview-frame--constrained > :deep(*) {
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}

.preview-frame--tablet {
  border-width: 10px;
  border-radius: 24px;
}
</style>

<!-- Unscoped styles for Teleported mobile controls -->
<style>
/* Floating action buttons */
.mobile-edit-controls {
  position: fixed;
  bottom: 24px;
  right: 20px;
  z-index: 9000;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-fab {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s, box-shadow 0.15s;
}

.mobile-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.mobile-fab--edit {
  background: #1f2937;
  color: #fff;
}

.mobile-fab--save {
  background: #059669;
  color: #fff;
}

/* Bottom sheet overlay */
.mobile-sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 9500;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.mobile-sheet {
  width: 100%;
  max-width: 500px;
  background: #fff;
  border-radius: 20px 20px 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.mobile-sheet__title {
  font-size: 17px;
  font-weight: 700;
  color: #1f2937;
}

.mobile-sheet__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
}

.mobile-sheet__tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.mobile-tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  color: #9ca3af;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s, box-shadow 0.15s;
}

.mobile-tab-btn--active {
  color: #1f2937;
  box-shadow: inset 0 -2px 0 #1f2937;
}

.mobile-sheet__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.mobile-sheet__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: #374151;
  transition: background 0.15s;
  text-align: left;
  font-family: inherit;
}

.mobile-sheet__item:hover {
  background: #f9fafb;
}

.mobile-sheet__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #f3f4f6;
  border-radius: 10px;
  color: #6b7280;
  flex-shrink: 0;
}

.mobile-sheet__icon svg {
  width: 18px;
  height: 18px;
}

.mobile-sheet__label {
  flex: 1;
}

.mobile-sheet__chevron {
  color: #d1d5db;
  flex-shrink: 0;
}

.mobile-sheet__footer {
  padding: 12px 20px 20px;
  border-top: 1px solid #e5e7eb;
}

.mobile-sheet__save {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: #059669;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.mobile-sheet__save:hover {
  background: #047857;
}

/* Sheet transition */
.mobile-sheet-enter-active,
.mobile-sheet-leave-active {
  transition: opacity 0.25s ease;
}

.mobile-sheet-enter-active .mobile-sheet,
.mobile-sheet-leave-active .mobile-sheet {
  transition: transform 0.25s ease;
}

.mobile-sheet-enter-from,
.mobile-sheet-leave-to {
  opacity: 0;
}

.mobile-sheet-enter-from .mobile-sheet,
.mobile-sheet-leave-to .mobile-sheet {
  transform: translateY(100%);
}
</style>
