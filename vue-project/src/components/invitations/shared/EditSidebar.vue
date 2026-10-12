<template>
  <aside class="edit-sidebar">
    <header class="edit-sidebar__header">
      <div class="edit-sidebar__header-left">
        <button
          type="button"
          class="save-btn"
          :class="{ 'save-btn--active': dirty || saveEnabled }"
          :disabled="!dirty && !saveEnabled"
          data-testid="editor-save"
          @click="emit('save')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          {{ t('editSection.save') }}
        </button>
      </div>
      <div class="edit-sidebar__header-right">
        <button
          type="button"
          class="preview-guest-btn"
          data-testid="preview-as-guest"
          @click="emit('preview-guest')"
        >
          {{ t('editSection.previewAsGuest') }}
        </button>
        <!-- INV-503: named for screen readers, the chosen one is pressed (not only darker) -->
        <div class="preview-devices" role="group" :aria-label="t('editSection.a11y.previewWidth')">
        <button
          type="button"
          class="preview-btn"
          :class="{ 'preview-btn--active': previewMode === 'mobile' }"
          :title="t('editSection.mobile')"
          :aria-label="t('editSection.mobile')"
          :aria-pressed="previewMode === 'mobile' ? 'true' : 'false'"
          data-preview-device="mobile"
          @click="emit('set-preview', 'mobile')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        </button>
        <button
          type="button"
          class="preview-btn"
          :class="{ 'preview-btn--active': previewMode === 'tablet' }"
          :title="t('editSection.tablet')"
          :aria-label="t('editSection.tablet')"
          :aria-pressed="previewMode === 'tablet' ? 'true' : 'false'"
          data-preview-device="tablet"
          @click="emit('set-preview', 'tablet')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        </button>
        <button
          type="button"
          class="preview-btn"
          :class="{ 'preview-btn--active': previewMode === 'desktop' }"
          :title="t('editSection.desktop')"
          :aria-label="t('editSection.desktop')"
          :aria-pressed="previewMode === 'desktop' ? 'true' : 'false'"
          data-preview-device="desktop"
          @click="emit('set-preview', 'desktop')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </button>
        </div>
      </div>
    </header>

    <!-- INV-801: undo / redo of this visit's changes -->
    <div v-if="history" class="edit-sidebar__history">
      <HistoryControls :state="history" @undo="emit('undo')" @redo="emit('redo')" />
    </div>

    <div class="edit-sidebar__save-status" :class="{ 'edit-sidebar__save-status--idle': !saveStatus || saveStatus === 'idle' }">
      <SaveStatus
        :status="saveStatus"
        :detail="saveStatusDetail"
        :last-synced-at="lastSyncedAt"
        @retry="emit('retry-save')"
      />
    </div>

    <!-- Steps of a new invitation (INV-102) -->
    <div v-if="$slots.stepper" class="edit-sidebar__steps">
      <slot name="stepper" />
    </div>

    <!-- Quick start / advanced settings (INV-103) -->
    <div class="edit-sidebar__mode">
      <EditorModeSwitch :mode="editorMode" @change="emit('set-editor-mode', $event)" />
    </div>

    <!-- Tab bar -->
    <!-- INV-503: a tab list — arrows / Home / End, one tab stop, selected in words -->
    <div
      ref="tabsRef"
      class="edit-sidebar__tabs"
      role="tablist"
      :aria-label="t('editSection.a11y.editorTabs')"
      @keydown="onTabsKeydown"
    >
      <button
        v-for="tab in visibleTabs"
        :id="tabId(tab)"
        :key="tab"
        type="button"
        role="tab"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === tab }"
        :data-tab="tab"
        :aria-selected="activeTab === tab ? 'true' : 'false'"
        :aria-controls="PANEL_ID"
        :tabindex="activeTab === tab ? 0 : -1"
        @click="switchTab(tab)"
      >
        {{ t('editSection.editorGroups.tabs.' + tab) }}
      </button>
    </div>

    <div :id="PANEL_ID" class="edit-sidebar__body" role="tabpanel" :aria-labelledby="tabId(activeTab)">
      <!-- Info panel -->
      <div v-if="activeTab === 'info'" class="info-panel-slot">
        <slot name="info-panel" />
      </div>

      <template v-else>
      <div
        v-for="g in groupedSections"
        :key="g.key"
        class="control-group"
        role="group"
        :aria-labelledby="groupHeadingId(g.key)"
        :data-group="g.key"
      >
      <h3 :id="groupHeadingId(g.key)" class="control-group__title">
        {{ t('editSection.editorGroups.' + g.key) }}
        <span v-if="g.advanced" class="control-group__badge">{{ t('editSection.editorGroups.advancedBadge') }}</span>
      </h3>
      <div v-for="s in g.sections" :key="s.key" class="accordion-section">
        <!-- Accordion header -->
        <!-- The row stays clickable with a mouse; the keyboard (and screen
             readers) use the real button inside it (INV-503). -->
        <div
          class="accordion-header"
          :class="{ 'accordion-header--active': activeSection === s.key }"
          @click="emit('toggle-section', s.key)"
        >
          <button
            :id="triggerId(s.key)"
            type="button"
            class="accordion-trigger"
            :aria-expanded="activeSection === s.key ? 'true' : 'false'"
            :aria-controls="contentId(s.key)"
            :data-section-trigger="s.key"
            @click.stop="emit('toggle-section', s.key)"
          >
            <span class="accordion-icon" aria-hidden="true" v-html="s.icon"></span>
            <span class="accordion-label">{{ s.label }}</span>
            <!-- INV-402: hidden in words, not only by the switch's colour -->
            <span
              v-if="hasVisibilitySwitch(s) && sectionVisibility[s.key] === false"
              class="accordion-hidden"
              data-testid="section-hidden-badge"
            >{{ t('editSection.sectionStates.hiddenBadge') }}</span>
          </button>
          <button
            v-if="hasVisibilitySwitch(s)"
            type="button"
            role="switch"
            class="section-toggle"
            :class="{ 'section-toggle--on': sectionVisibility[s.key] !== false }"
            :aria-checked="sectionVisibility[s.key] !== false ? 'true' : 'false'"
            :aria-label="t('editSection.sectionStates.toggleShow', { section: s.label })"
            :data-section-toggle="s.key"
            :title="sectionVisibility[s.key] === false ? t('editSection.showSection') : t('editSection.hideSection')"
            @click.stop="emit('toggle-visibility', s.key)"
          >
            <span class="section-toggle__knob"></span>
          </button>
          <svg
            class="accordion-chevron"
            :class="{ 'accordion-chevron--open': activeSection === s.key }"
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        <!-- Accordion content (collapsible). Escape closes it and puts the
             focus back on its header (INV-503). -->
        <Transition name="accordion">
          <div
            v-if="activeSection === s.key"
            :id="contentId(s.key)"
            class="accordion-content"
            role="region"
            :aria-labelledby="triggerId(s.key)"
            @keydown.esc="onContentEscape($event, s.key)"
          >
            <div
              v-if="subTabsOf(s).length > 1"
              class="sub-tab-bar"
              role="tablist"
              :aria-label="s.label"
              @keydown="onSubTabsKeydown($event, s)"
            >
              <button
                v-for="st in subTabsOf(s)"
                :key="st"
                type="button"
                role="tab"
                class="sub-tab-btn"
                :class="{ 'sub-tab-btn--active': currentSubTab(s) === st }"
                :aria-selected="currentSubTab(s) === st ? 'true' : 'false'"
                :tabindex="currentSubTab(s) === st ? 0 : -1"
                :data-sub-tab="st"
                @click="activeSubTab = st"
              >{{ t('editSection.' + st + 'Tab') }}</button>
            </div>
            <slot :name="s.key" :sub-tab="currentSubTab(s)" />
          </div>
        </Transition>
      </div>
      </div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { provide, ref, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import SaveStatus from "@/components/invitations/shared/SaveStatus.vue";
import HistoryControls from "@/components/invitations/shared/HistoryControls.vue";
import { focusInfoField } from "@/utils/creationSteps";
import { onTablistKeydown } from "@/utils/tablist";
import { focusIsLost } from "@/utils/focusTrap";
import EditorModeSwitch from "@/components/invitations/shared/EditorModeSwitch.vue";
import { EDITOR_MODES, tabsForMode, groupedSectionsForMode, sectionSubTabs, isAdvancedSection, tabOf, hasVisibilitySwitch } from "@/composables/useEditorMode";

const { t } = useI18n();

const props = defineProps({
  sections: {
    type: Array,
    required: true,
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
  showLayoutTab: {
    type: Boolean,
    default: false,
  },
  saveStatus: { type: String, default: 'idle' },
  saveStatusDetail: { type: String, default: null },
  lastSyncedAt: { type: Date, default: null },
  // A new invitation not saved anywhere but this device (INV-104).
  saveEnabled: { type: Boolean, default: false },
  // { field, n } — the stepper asks for an Info field to be fixed (INV-102).
  infoFocus: { type: Object, default: null },
  // 'quick' | 'advanced' (INV-103) — only which controls show, never the data.
  editorMode: { type: String, default: EDITOR_MODES.QUICK },
  // { key, n } — a section asked for from outside the panel: show its tab.
  revealRequest: { type: Object, default: null },
  // INV-801: { canUndo, canRedo, undoWhat, redoWhat } — null: no undo/redo here.
  history: { type: Object, default: null },
});

const emit = defineEmits(["toggle-section", "toggle-visibility", "save", "set-preview", "retry-save", "preview-guest", "set-editor-mode", "undo", "redo"]);

const activeTab = ref('info');
const activeSubTab = ref('content');

const visibleTabs = computed(() => tabsForMode(props.editorMode));

// INV-501: the controls of the tab, by task group (same as the phone sheet).
const groupedSections = computed(() =>
  groupedSectionsForMode(props.sections, props.editorMode, activeTab.value)
);
// Two sidebars are never mounted at once, but the sheet uses its own ids.
const groupHeadingId = (key) => `edit-sidebar-group-${key}`;
const PANEL_ID = "edit-sidebar-panel";
const tabId = (tab) => `edit-sidebar-tab-${tab}`;
const triggerId = (key) => `edit-sidebar-trigger-${key}`;
const contentId = (key) => `edit-sidebar-section-${key}`;

const tabsRef = ref(null);

function onTabsKeydown(e) {
  onTablistKeydown(e, { tabs: visibleTabs.value, current: activeTab.value, select: switchTab, root: tabsRef.value });
}

function onSubTabsKeydown(e, section) {
  onTablistKeydown(e, {
    tabs: subTabsOf(section),
    current: currentSubTab(section),
    select: (st) => { activeSubTab.value = st; },
    attr: "data-sub-tab",
  });
}

function focusTrigger(key) {
  document.getElementById(triggerId(key))?.focus();
}

// Escape inside an open section closes it; focus goes back to its header.
function onContentEscape(e, key) {
  if (e.defaultPrevented) return;
  e.preventDefault();
  emit("toggle-section", key);
  nextTick(() => focusTrigger(key));
}

function subTabsOf(section) {
  return sectionSubTabs(section, { mode: props.editorMode, layoutsAvailable: props.showLayoutTab });
}

// A sub-tab the section (or the mode) no longer offers falls back to content.
function currentSubTab(section) {
  return subTabsOf(section).includes(activeSubTab.value) ? activeSubTab.value : 'content';
}

// Back to the quick start: a tab or sub-tab it does not show closes; the
// values set there stay on the invitation.
watch(() => props.editorMode, () => {
  if (!subTabsOf({ layout: true }).includes(activeSubTab.value)) activeSubTab.value = 'content';
  // switchTab already closes the open section (toggle-section is a toggle:
  // never send it twice for one change).
  if (!visibleTabs.value.includes(activeTab.value)) {
    switchTab('sections');
    return;
  }
  const open = props.sections.find(s => s.key === props.activeSection);
  if (open && props.editorMode !== EDITOR_MODES.ADVANCED && isAdvancedSection(open)) {
    emit('toggle-section', open.key);
  }
});

// INV-503: a section that closes while the focus is in it (its Close button,
// a save) hands the focus to its header instead of dropping it on the page; a
// section opened from the preview's "Edit …" button takes the focus to its
// header, so the keyboard continues where the form is.
watch(() => props.activeSection, (key, old) => {
  const active = document.activeElement;
  const focusWasIn = old && document.getElementById(contentId(old))?.contains(active);
  const fromPreview = key && active?.closest?.(".preview-frame [data-edit-section]");
  if (!focusWasIn && !fromPreview) return;
  nextTick(() => {
    if (fromPreview) focusTrigger(key);
    else if (focusIsLost()) focusTrigger(old);
  });
}, { flush: 'pre' });

// When active section changes, switch to the correct tab and reset sub-tab
watch(() => props.activeSection, (key) => {
  activeSubTab.value = 'content';
  if (!key) return;
  const section = props.sections.find(s => s.key === key);
  if (section) {
    const tab = tabOf(section);
    // A section the mode does not show (the entry the editor opens by itself in
    // the quick start) does not move the person to a tab that is not there.
    if (activeTab.value !== tab && visibleTabs.value.includes(tab)) activeTab.value = tab;
  }
});

watch(() => props.revealRequest, (request) => {
  const section = request && props.sections.find(s => s.key === request.key);
  if (section) activeTab.value = tabOf(section);
});

// The stepper sent somebody to an Info field: that tab, then the field.
watch(() => props.infoFocus, async (request) => {
  if (!request?.field) return;
  switchTab('info');
  await nextTick();
  focusInfoField(request.field);
});

function switchTab(tab) {
  if (activeTab.value === tab) return;
  // Collapse any open section when switching tabs
  if (props.activeSection) {
    emit('toggle-section', props.activeSection);
  }
  activeTab.value = tab;
}

// Provide editPanelMode so BaseModal renders inline (teleport disabled)
provide("editPanelMode", ref(true));
</script>

<style scoped>
.edit-sidebar {
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-left: 1px solid var(--line);
  overflow: hidden;
}

.edit-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  gap: 8px;
}

.edit-sidebar__steps {
  padding: 8px 12px 4px;
  border-bottom: 1px solid var(--line);
}

.edit-sidebar__mode {
  padding: 10px 16px;
  border-bottom: 1px solid var(--line);
}

.edit-sidebar__header-left {
  display: flex;
  align-items: center;
}

.edit-sidebar__header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.edit-sidebar__history {
  display: flex;
  justify-content: flex-start;
  padding: 8px 16px;
  border-bottom: 1px solid var(--line);
}

.edit-sidebar__save-status {
  padding: 8px 16px;
  border-bottom: 1px solid var(--line);
  background: var(--bg-2, #f9fafb);
}

.edit-sidebar__save-status--idle {
  padding: 0;
  border-bottom: 0;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--line-2);
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-4);
  cursor: not-allowed;
  transition: all 0.2s;
  font-family: inherit;
}

.save-btn--active {
  background: #059669;
  border-color: #059669;
  color: #fff;
  cursor: pointer;
}

.save-btn--active:hover {
  background: #047857;
}

.preview-guest-btn {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
  color: var(--ink-2);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.preview-guest-btn:hover {
  border-color: var(--ink-4);
}

.preview-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
  color: var(--ink-4);
  cursor: pointer;
  transition: all 0.15s;
}

.preview-btn:hover {
  border-color: var(--ink-4);
  color: var(--ink-2);
}

.preview-btn--active {
  border-color: var(--ink-2);
  background: var(--sunken);
  color: var(--ink-2);
}

/* Tab bar */
.edit-sidebar__tabs {
  display: flex;
  border-bottom: 1px solid var(--line);
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-4);
  cursor: pointer;
  transition: color 0.15s, box-shadow 0.15s;
  font-family: inherit;
  position: relative;
}

.tab-btn:hover {
  color: var(--ink-3);
}

.tab-btn--active {
  color: var(--ink);
  box-shadow: inset 0 -2px 0 var(--ink);
}

.edit-sidebar__body {
  flex: 1;
  overflow-y: auto;
}

/* INV-501: a task group (Content, RSVP / Animation, Colours and fonts) */
.control-group__title {
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 14px 16px 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-3);
  border-bottom: 1px solid var(--line);
}

.control-group__badge {
  padding: 0 6px;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 10px;
  letter-spacing: 0;
  text-transform: none;
}

.accordion-section {
  border-bottom: 1px solid var(--line);
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-2);
  transition: background 0.15s;
  font-family: inherit;
}

.accordion-header:hover {
  background: var(--sunken);
}

.accordion-header--active {
  background: var(--sunken);
}

.accordion-trigger {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.accordion-trigger:focus-visible,
.section-toggle:focus-visible,
.tab-btn:focus-visible,
.sub-tab-btn:focus-visible,
.preview-btn:focus-visible {
  outline: 3px solid var(--moss, #5e7f58);
  outline-offset: 2px;
}

.tab-btn:focus-visible,
.sub-tab-btn:focus-visible {
  outline-offset: -3px;
}

.preview-devices {
  display: flex;
  gap: 4px;
}

.accordion-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--ink-3);
  flex-shrink: 0;
}

.accordion-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.accordion-label {
  flex: 1;
  text-align: left;
}

.accordion-hidden {
  padding: 0 6px;
  border: 1px dashed currentColor;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: var(--neutral-600, var(--ink-3));
}

.section-toggle {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  border: none;
  background: var(--line-2);
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
  padding: 0;
}

.section-toggle--on {
  background: #059669;
}

.section-toggle__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.section-toggle--on .section-toggle__knob {
  transform: translateX(16px);
}

.accordion-chevron {
  transition: transform 0.25s ease;
  margin-left: auto;
  color: var(--ink-4);
  flex-shrink: 0;
}

.accordion-chevron--open {
  transform: rotate(90deg);
}

.accordion-content {
  display: block;
  overflow: hidden;
  padding: 12px 16px 16px;
}

/* Sub-tab bar */
.sub-tab-bar {
  display: flex;
  border-bottom: 1px solid var(--line);
  background: #fafafa;
  margin: -12px -16px 12px;
}

.sub-tab-btn {
  flex: 1;
  padding: 8px 8px;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-4);
  cursor: pointer;
  transition: color 0.15s, box-shadow 0.15s;
  font-family: inherit;
  position: relative;
}

.sub-tab-btn:hover {
  color: var(--ink-3);
}

.sub-tab-btn--active {
  color: var(--ink);
  box-shadow: inset 0 -2px 0 var(--ink);
}

/* Accordion transition */
.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.3s ease, opacity 0.2s ease;
  overflow: hidden;
  max-height: 2000px;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
