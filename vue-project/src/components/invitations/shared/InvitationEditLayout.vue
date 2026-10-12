<template>
  <div :class="['inv-layout', { 'inv-layout--split': editMode && isDesktop, 'inv-layout--guest': guestMode }]">
    <!-- INV-602: the guest preview's bar sits above the invitation, never in it -->
    <slot v-if="guestMode" name="toolbar" />
    <!-- Left: Invitation Preview -->
    <div
      ref="stageRef"
      class="inv-layout__preview"
      :class="{
        'inv-layout__preview--split': editMode && isDesktop,
        'inv-layout__preview--device': isConstrained || guestFrame.bezel,
        'inv-layout__preview--guest': guestMode,
        'inv-layout__preview--scaled': guestMode && guestFrame.scale < 1,
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
          'preview-frame--constrained': isConstrained || guestFrame.bezel,
          ['preview-frame--' + previewMode]: isConstrained,
          'preview-frame--guest': guestMode,
        }"
        :style="frameStyle"
        :data-guest-device="guestMode ? guestDevice : undefined"
        :data-guest-scale="guestMode ? guestFrame.scale : undefined"
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
      :show-layout-tab="showLayoutTab"
      :save-status="saveStatus"
      :save-status-detail="saveStatusDetail"
      :last-synced-at="lastSyncedAt"
      :save-enabled="saveEnabled"
      :info-focus="infoFocus"
      :editor-mode="editorMode"
      :reveal-request="revealRequest"
      :history="history"
      @undo="emit('undo')"
      @redo="emit('redo')"
      @set-editor-mode="setEditorMode"
      @preview-guest="emit('preview-guest')"
      @retry-save="emit('retry-save')"
      @toggle-section="emit('toggle-section', $event)"
      @toggle-visibility="emit('toggle-visibility', $event)"
      @save="emit('save')"
      @set-preview="emit('set-preview', $event)"
    >
      <!-- Forward info panel slot -->
      <template #info-panel>
        <slot name="info-panel" />
      </template>
      <template v-if="$slots.stepper" #stepper>
        <slot name="stepper" />
      </template>
      <!-- Forward named slots from parent (with scoped slot data) -->
      <template v-for="s in sections" :key="s.key" #[s.key]="slotProps">
        <slot :name="'section-' + s.key" v-bind="slotProps" />
      </template>
    </EditSidebar>

    <!-- Mobile: floating edit controls + section picker -->
    <template v-if="editMode && !isDesktop">
      <Teleport to="body">
        <!-- Save status (IVY-INV-301) — always mounted so changes are announced -->
        <div class="mobile-save-status" :class="{ 'mobile-save-status--idle': !saveStatus || saveStatus === 'idle' }">
          <SaveStatus
            :status="saveStatus"
            :detail="saveStatusDetail"
            :last-synced-at="lastSyncedAt"
            @retry="emit('retry-save')"
          />
        </div>

        <!-- INV-801: undo / redo, with the floating buttons -->
        <div
          v-if="history && !showMobilePicker && !activeSection"
          class="mobile-history"
          :class="{ 'mobile-history--raised': saveStatus && saveStatus !== 'idle' }"
        >
          <HistoryControls :state="history" compact @undo="emit('undo')" @redo="emit('redo')" />
        </div>

        <!-- Floating buttons (hidden when picker or a modal is open) -->
        <div v-if="!showMobilePicker && !activeSection" class="mobile-edit-controls">
          <button
            class="mobile-fab mobile-fab--preview"
            type="button"
            :aria-label="t('editSection.previewAsGuest')"
            data-testid="preview-as-guest"
            @click="emit('preview-guest')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button v-if="dirty || saveEnabled" class="mobile-fab mobile-fab--save" type="button" :aria-label="t('editSection.save')" data-testid="editor-save" @click="emit('save')">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
          </button>
          <button
            ref="customizeRef"
            class="mobile-fab mobile-fab--edit"
            type="button"
            :aria-label="t('editSection.customize')"
            aria-haspopup="dialog"
            data-testid="mobile-customize"
            @click="showMobilePicker = true"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
          </button>
        </div>

        <!-- Mobile section picker (bottom sheet) -->
        <Transition name="mobile-sheet">
          <div v-if="showMobilePicker" class="mobile-sheet-overlay" @mousedown.self="showMobilePicker = false">
            <!-- INV-503: a dialog — focus starts in it, Tab stays in it, Escape
                 closes it (or a panel first) and focus returns to "Customize". -->
            <div
              ref="sheetRef"
              class="mobile-sheet"
              role="dialog"
              aria-modal="true"
              :aria-labelledby="SHEET_TITLE_ID"
              data-testid="mobile-sheet"
              @keydown="onSheetKeydown"
            >
              <div class="mobile-sheet__header">
                <h2 :id="SHEET_TITLE_ID" class="mobile-sheet__title">{{ t('editSection.customize') }}</h2>
                <HistoryControls v-if="history" class="mobile-sheet__history" :state="history" compact @undo="emit('undo')" @redo="emit('redo')" />
                <button ref="sheetCloseRef" type="button" class="mobile-sheet__close" :aria-label="t('common.close')" @click="showMobilePicker = false">&times;</button>
              </div>
              <div v-if="$slots.stepper" class="mobile-sheet__steps">
                <slot name="stepper" />
              </div>
              <div class="mobile-sheet__mode">
                <EditorModeSwitch :mode="editorMode" @change="setEditorMode" />
              </div>
              <!-- A plain panel (photos, colours) or a layout picker opens here,
                   in the sheet, with the way back to the list (INV-103). -->
              <template v-if="mobilePanelSection">
                <div class="mobile-sheet__panel-head">
                  <button ref="panelBackRef" type="button" class="mobile-sheet__back" data-testid="mobile-panel-back" @click="closeMobilePanel">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                    {{ t('editSection.editorMode.back') }}
                  </button>
                  <span class="mobile-sheet__panel-title">{{ mobilePanelSection.label }}<template v-if="mobilePanel.subTab === 'layout'"> · {{ t('editSection.layoutTab') }}</template></span>
                </div>
                <div class="mobile-sheet__body mobile-sheet__body--panel" data-testid="mobile-sheet-panel">
                  <slot :name="'section-' + mobilePanel.key" :sub-tab="mobilePanel.subTab" />
                </div>
              </template>
              <template v-else>
              <div
                ref="mobileTabsRef"
                class="mobile-sheet__tabs"
                role="tablist"
                :aria-label="t('editSection.a11y.editorTabs')"
                @keydown="onMobileTabsKeydown"
              >
                <button
                  v-for="tab in mobileTabs"
                  :id="'mobile-sheet-tab-' + tab"
                  :key="tab"
                  type="button"
                  role="tab"
                  class="mobile-tab-btn"
                  :class="{ 'mobile-tab-btn--active': mobileTab === tab }"
                  :data-tab="tab"
                  :aria-selected="mobileTab === tab ? 'true' : 'false'"
                  aria-controls="mobile-sheet-panel"
                  :tabindex="mobileTab === tab ? 0 : -1"
                  @click="mobileTab = tab"
                >
                  {{ t('editSection.editorGroups.tabs.' + tab) }}
                </button>
              </div>
              <div id="mobile-sheet-panel" class="mobile-sheet__body" role="tabpanel" :aria-labelledby="'mobile-sheet-tab-' + mobileTab">
                <div v-if="mobileTab === 'info'" class="mobile-info-panel">
                  <slot name="info-panel" />
                </div>
                <!-- INV-501: the same task groups, order and labels as the sidebar -->
                <div
                  v-for="g in mobileGroupedSections"
                  :key="g.key"
                  class="mobile-sheet__group"
                  role="group"
                  :aria-labelledby="'mobile-sheet-group-' + g.key"
                  :data-group="g.key"
                >
                <h3 :id="'mobile-sheet-group-' + g.key" class="mobile-sheet__group-title">
                  {{ t('editSection.editorGroups.' + g.key) }}
                  <span v-if="g.advanced" class="mobile-sheet__group-badge">{{ t('editSection.editorGroups.advancedBadge') }}</span>
                </h3>
                <div
                  v-for="s in g.sections"
                  :key="s.key"
                  class="mobile-sheet__row"
                >
                  <button
                    type="button"
                    class="mobile-sheet__item"
                    :data-section="s.key"
                    :aria-haspopup="s.panel ? undefined : 'dialog'"
                    @click="onMobileSection(s.key)"
                  >
                    <span class="mobile-sheet__icon" aria-hidden="true" v-html="s.icon"></span>
                    <span class="mobile-sheet__label">{{ s.label }}</span>
                    <span
                      v-if="hasVisibilitySwitch(s) && sectionVisibility[s.key] === false"
                      class="mobile-sheet__hidden"
                      data-testid="section-hidden-badge"
                    >{{ t('editSection.sectionStates.hiddenBadge') }}</span>
                    <svg class="mobile-sheet__chevron" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <button
                    v-if="mobileSubTabs(s).includes('layout')"
                    type="button"
                    class="mobile-sheet__sub"
                    :data-section-layout="s.key"
                    :aria-label="s.label + ': ' + t('editSection.layoutTab')"
                    @click="openMobilePanel(s.key, 'layout')"
                  >{{ t('editSection.layoutTab') }}</button>
                  <!-- The same show/hide switch as on the sidebar (INV-402) -->
                  <button
                    v-if="hasVisibilitySwitch(s)"
                    type="button"
                    role="switch"
                    class="mobile-sheet__toggle"
                    :class="{ 'mobile-sheet__toggle--on': sectionVisibility[s.key] !== false }"
                    :aria-checked="sectionVisibility[s.key] !== false ? 'true' : 'false'"
                    :aria-label="t('editSection.sectionStates.toggleShow', { section: s.label })"
                    :data-section-toggle="s.key"
                    @click="emit('toggle-visibility', s.key)"
                  >
                    <span class="mobile-sheet__toggle-knob"></span>
                  </button>
                </div>
                </div>
              </div>
              </template>
              <!-- INV-501: Preview is one of the basic tasks — here too, before Save -->
              <div class="mobile-sheet__footer">
                <button
                  type="button"
                  class="mobile-sheet__preview"
                  data-testid="sheet-preview-as-guest"
                  @click="showMobilePicker = false; emit('preview-guest')"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {{ t('editSection.previewAsGuest') }}
                </button>
                <button v-if="dirty || saveEnabled" type="button" class="mobile-sheet__save" @click="emit('save'); showMobilePicker = false">
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        <template v-if="activeSection === s.key && showsOnPhone(s)">
          <slot :name="'section-' + s.key" sub-tab="content" />
        </template>
      </template>
    </template>

    <!-- The editor opened its advanced settings by itself (INV-103) -->
    <div v-if="editMode" class="inv-layout__sr-only" role="status" aria-live="polite">{{ modeAnnouncement }}</div>
    <!-- INV-801: what undo / redo just did (one region for sidebar, bar and sheet) -->
    <div v-if="editMode && history" class="inv-layout__sr-only" role="status" aria-live="polite" data-testid="history-status">{{ history.announcement }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { focusInfoField } from "@/utils/creationSteps";
import { useI18n } from "vue-i18n";
import { useMediaQuery } from "@/composables/useMediaQuery";
import EditSidebar from "@/components/invitations/shared/EditSidebar.vue";
import HistoryControls from "@/components/invitations/shared/HistoryControls.vue";
import SaveStatus from "@/components/invitations/shared/SaveStatus.vue";
import EditorModeSwitch from "@/components/invitations/shared/EditorModeSwitch.vue";
import { onTablistKeydown } from "@/utils/tablist";
import { trapTab, focusIsLost } from "@/utils/focusTrap";
import { useEditorMode, EDITOR_MODES, tabsForMode, groupedSectionsForMode, sectionSubTabs, isAdvancedSection, hasVisibilitySwitch, tabOf } from "@/composables/useEditorMode";

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
  showLayoutTab: {
    type: Boolean,
    default: false,
  },
  saveStatus: { type: String, default: 'idle' },
  saveStatusDetail: { type: String, default: null },
  lastSyncedAt: { type: Date, default: null },
  // A new invitation not yet saved anywhere but this device (INV-104): Save is
  // available before the first change — it is how a guest reaches sign-up.
  saveEnabled: { type: Boolean, default: false },
  // { field, n } — the stepper asks for an Info field to be fixed (INV-102).
  infoFocus: { type: Object, default: null },
  // INV-602: the guest preview's view — 'mobile' | 'desktop'; null = none
  // (the editor, a guest's own visit, the catalogue's embedded preview).
  guestDevice: { type: String, default: null },
  // INV-801: { canUndo, canRedo, undoWhat, redoWhat, announcement } — null: none.
  history: { type: Object, default: null },
});

const emit = defineEmits(["toggle-section", "toggle-visibility", "save", "set-preview", "select-section", "retry-save", "preview-guest", "undo", "redo"]);

const isDesktop = useMediaQuery("(min-width: 1024px)");
const showMobilePicker = ref(false);
const mobileTab = ref('info');

// Quick start / advanced settings (INV-103): one mode for sidebar and sheet.
const { editorMode, setEditorMode } = useEditorMode();
const modeAnnouncement = ref('');
const mobilePanel = ref(null); // { key, subTab } — shown inside the sheet

const mobileTabs = computed(() => tabsForMode(editorMode.value));

// INV-501: by task group, like the sidebar.
const mobileGroupedSections = computed(() =>
  groupedSectionsForMode(props.sections, editorMode.value, mobileTab.value)
);

const mobilePanelSection = computed(() =>
  mobilePanel.value ? props.sections.find(s => s.key === mobilePanel.value.key) || null : null
);

function mobileSubTabs(section) {
  return sectionSubTabs(section, { mode: editorMode.value, layoutsAvailable: props.showLayoutTab });
}

// { key, n } — a section the person asked for from outside the panel.
const revealRequest = ref(null);
// The advanced section the person opened on the phone. The editor also opens
// the entry section by itself while the entry overlay shows; that one must not
// cover the overlay on a phone.
const phoneOpenedKey = ref(null);

/**
 * Opens a section the person asked for from outside the panel (the "Edit
 * entry" button on the entry overlay). One of the advanced settings turns them
 * on rather than staying hidden, and says so.
 */
function requestSection(key, { focus = false } = {}) {
  const section = props.sections.find(s => s.key === key);
  if (!section) return;
  if (isAdvancedSection(section) && editorMode.value !== EDITOR_MODES.ADVANCED) {
    setEditorMode(EDITOR_MODES.ADVANCED);
    modeAnnouncement.value = t('editSection.editorMode.openedAdvanced', { section: section.label });
  }
  // INV-602: on a phone a plain panel (photos, colours) opens in the sheet.
  if (!isDesktop.value && section.panel) {
    mobileTab.value = tabOf(section);
    showMobilePicker.value = true;
    nextTick(() => openMobilePanel(key, 'content'));
    return;
  }
  phoneOpenedKey.value = key;
  if (props.activeSection !== key) emit('toggle-section', key);
  revealRequest.value = { key, n: (revealRequest.value?.n || 0) + 1 };
  if (!isDesktop.value) showMobilePicker.value = false;
  // Sent here from the guest preview's notes: the keyboard lands on the section.
  if (focus && isDesktop.value) {
    nextTick(() => nextTick(() => document.getElementById(`edit-sidebar-trigger-${key}`)?.focus()));
  }
}

defineExpose({ requestSection });

watch(() => props.activeSection, (key) => {
  if (!key) phoneOpenedKey.value = null;
});

// On a phone, an open section shows over the invitation — a plain panel shows
// in the sheet instead, and a section of the advanced settings only when the
// person opened it in that mode.
function showsOnPhone(section) {
  if (section.panel) return false;
  if (!isAdvancedSection(section)) return true;
  return editorMode.value === EDITOR_MODES.ADVANCED && phoneOpenedKey.value === section.key;
}

// Back to the quick start: what it does not show closes (the values stay).
watch(editorMode, (mode) => {
  if (!tabsForMode(mode).includes(mobileTab.value)) mobileTab.value = 'sections';
  const panel = mobilePanel.value;
  if (panel) {
    const section = mobilePanelSection.value;
    const hidden = !section
      || (mode !== EDITOR_MODES.ADVANCED && isAdvancedSection(section))
      || (panel.subTab !== 'content' && !mobileSubTabs(section).includes(panel.subTab));
    if (hidden) mobilePanel.value = null;
  }
  if (mode !== EDITOR_MODES.ADVANCED) modeAnnouncement.value = '';
});

function openMobilePanel(key, subTab = 'content') {
  mobilePanel.value = { key, subTab };
  // The list item that opened it is gone: the way back takes the focus.
  nextTick(() => panelBackRef.value?.focus());
}

function closeMobilePanel() {
  const key = mobilePanel.value?.key;
  mobilePanel.value = null;
  nextTick(() => {
    document.querySelector(`.mobile-sheet [data-section="${key}"]`)?.focus();
  });
}

const isConstrained = computed(() =>
  props.editMode && props.previewMode !== 'desktop'
);

const targetWidth = computed(() =>
  PREVIEW_WIDTHS[props.previewMode] || 0
);

/* ---- The guest preview's phone / computer view (INV-602) ---------- */
// The invitation is drawn by this same page (its own data, unsaved photos
// included) in a frame of the device's width; the frame is its own scroll
// box, so the bar above stays and the entry overlay stays inside it. The
// invitation's root is a size container, so the design's container queries
// answer to the frame, not to the browser window.
const GUEST_WIDTHS = { mobile: 390, desktop: 1280 };
const GUEST_DESKTOP_MAX_HEIGHT = 900;
// The phone drawn on a wider screen: its 12px bezel on both sides, and room
// around it; below that the phone view is the screen itself.
const BEZEL = 12;
const GUEST_BEZEL_MIN = GUEST_WIDTHS.mobile + 2 * BEZEL + 32;
const STAGE_PADDING = 24;
const MIN_FRAME_HEIGHT = 200;

const guestMode = computed(() => !props.editMode && !!props.guestDevice);
const stageRef = ref(null);
const stage = ref({ width: 0, height: 0 });
let stageObserver = null;

function measureStage() {
  const el = stageRef.value;
  if (!el) return;
  stage.value = { width: el.clientWidth, height: el.clientHeight };
}

onMounted(() => {
  measureStage();
  if (typeof ResizeObserver !== 'undefined' && stageRef.value) {
    stageObserver = new ResizeObserver(measureStage);
    stageObserver.observe(stageRef.value);
  } else if (typeof window !== 'undefined') {
    window.addEventListener('resize', measureStage);
  }
});

onBeforeUnmount(() => {
  stageObserver?.disconnect();
  if (typeof window !== 'undefined') window.removeEventListener('resize', measureStage);
});

watch(guestMode, () => nextTick(measureStage));

const guestFrame = computed(() => {
  const { width, height } = stage.value;
  if (!guestMode.value || !width || !height) return { bezel: false, scale: 1, style: {} };
  if (props.guestDevice === 'mobile') {
    if (width >= GUEST_BEZEL_MIN) {
      const frameHeight = Math.max(height - 2 * STAGE_PADDING, MIN_FRAME_HEIGHT);
      return { bezel: true, scale: 1, style: { width: GUEST_WIDTHS.mobile + 2 * BEZEL + 'px', height: frameHeight + 'px', maxHeight: 'none' } };
    }
    return { bezel: false, scale: 1, style: { width: width + 'px', height: height + 'px' } };
  }
  if (width >= GUEST_WIDTHS.desktop) {
    return { bezel: false, scale: 1, style: { width: width + 'px', height: height + 'px' } };
  }
  // A computer's width on a narrower screen: drawn at 1280px, scaled to fit —
  // no taller than a computer's screen (a phone's tall stage would make a
  // screen no computer has, and the design's full-screen parts would not fill it).
  const scale = Math.floor((width / GUEST_WIDTHS.desktop) * 1000) / 1000;
  return {
    bezel: false,
    scale,
    style: {
      width: GUEST_WIDTHS.desktop + 'px',
      height: Math.round(Math.min(height / scale, GUEST_DESKTOP_MAX_HEIGHT)) + 'px',
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
    },
  };
});

const frameStyle = computed(() => {
  if (guestMode.value) return guestFrame.value.style;
  if (!isConstrained.value) return {};
  return { width: targetWidth.value + 'px' };
});

// On a phone the Info fields are in the sheet: open it there, then the field.
watch(() => props.infoFocus, async (request) => {
  if (!request?.field || isDesktop.value) return;
  showMobilePicker.value = true;
  mobileTab.value = 'info';
  await nextTick();
  focusInfoField(request.field);
});

// A section opened from elsewhere (the stepper) shows over the sheet's place.
watch(() => props.activeSection, (key) => {
  if (key && !isDesktop.value) showMobilePicker.value = false;
});

function onMobileSection(key) {
  const section = props.sections.find(s => s.key === key);
  // Plain panels have no modal of their own: they open inside the sheet
  // (before, they rendered below the invitation, out of sight).
  if (section?.panel) {
    openMobilePanel(key, 'content');
    return;
  }
  showMobilePicker.value = false;
  phoneOpenedKey.value = key;
  emit('toggle-section', key);
}

/* ---- The sheet as a dialog (INV-503) ---- */
const SHEET_TITLE_ID = 'mobile-sheet-title';
const sheetRef = ref(null);
const sheetCloseRef = ref(null);
const panelBackRef = ref(null);
const customizeRef = ref(null);
const mobileTabsRef = ref(null);

function onMobileTabsKeydown(e) {
  onTablistKeydown(e, { tabs: mobileTabs.value, current: mobileTab.value, select: (tab) => { mobileTab.value = tab; }, root: mobileTabsRef.value });
}

function onSheetKeydown(e) {
  if (e.key === 'Escape' && !e.defaultPrevented) {
    e.preventDefault();
    if (mobilePanel.value) closeMobilePanel();
    else showMobilePicker.value = false;
    return;
  }
  trapTab(e, sheetRef.value);
}

// Back to "Customize" when nothing else took the focus (a section's dialog
// opened from the sheet takes it itself).
function focusCustomize() {
  nextTick(() => {
    // Focus left in a sheet or dialog that is still fading out counts as lost.
    const leaving = document.activeElement?.closest?.('.mobile-sheet-overlay, .ivy-overlay');
    if (focusIsLost() || leaving) customizeRef.value?.focus();
  });
}

watch(showMobilePicker, (open) => {
  if (open) {
    nextTick(() => sheetCloseRef.value?.focus());
    return;
  }
  mobilePanel.value = null;
  if (!props.activeSection) focusCustomize();
});

// A section's dialog on the phone closed: the floating buttons are back.
watch(() => props.activeSection, (key, old) => {
  if (!key && old && !isDesktop.value && !showMobilePicker.value) focusCustomize();
});

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
  background: var(--line);
}

/* In split edit mode, contain fixed-positioned children (entry overlays)
   so they stay within the preview column and don't cover the sidebar */
.preview-frame--edit {
  position: relative;
  transform: translateZ(0);
  height: 100%;
}

/* Preview frame — always wraps the slot */
.preview-frame--constrained {
  position: relative;
  border: 12px solid var(--ink);
  border-radius: 36px;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 25px 60px -12px rgba(0, 0, 0, 0.25),
    inset 0 0 0 2px var(--ink-2);
  flex-shrink: 0;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  /* contain fixed-positioned children (e.g. entry overlays) */
  transform: translateZ(0);
}

.preview-frame--tablet {
  border-width: 10px;
  border-radius: 24px;
}

/* INV-602: the guest preview — its bar on top, the invitation in a frame of
   the chosen device's width below it (the frame scrolls, not the page). */
.inv-layout--guest {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.inv-layout__preview--guest {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

/* the computer view scaled down: the rest of the stage is not the invitation */
.inv-layout__preview--scaled {
  background: var(--line);
}

.inv-layout__preview--guest.inv-layout__preview--device {
  padding: 24px 16px;
}

.preview-frame--guest {
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  /* contain fixed-positioned children (the entry overlay) in the frame */
  transform: translateZ(0);
  background: #fff;
}

.preview-frame--guest.preview-frame--constrained {
  overflow-x: hidden;
}
</style>

<!-- Unscoped styles for Teleported mobile controls -->
<style>
/* Floating action buttons */
.mobile-save-status {
  position: fixed;
  left: 16px;
  right: 88px;
  bottom: 24px;
  z-index: 8999;
  padding: 8px 12px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.mobile-save-status--idle {
  padding: 0;
  box-shadow: none;
  background: transparent;
  pointer-events: none;
}

/* INV-801: undo / redo on the phone — bottom left, above the save status */
.mobile-history {
  position: fixed;
  left: 16px;
  bottom: 24px;
  z-index: 9000;
  padding: 4px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.mobile-history--raised {
  bottom: 84px;
}

.mobile-sheet__history {
  margin-left: auto;
  margin-right: 8px;
}

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

.mobile-fab--preview {
  background: #fff;
  color: var(--ink-2, #344054);
}

.mobile-fab--edit {
  background: var(--ink);
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
  border-bottom: 1px solid var(--line);
}

.mobile-sheet__title {
  margin: 0;
  font-family: inherit;
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
}

.mobile-sheet__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--sunken);
  border-radius: 50%;
  font-size: 18px;
  color: var(--ink-3);
  cursor: pointer;
}

.mobile-sheet__steps {
  padding: 8px 12px 4px;
  border-bottom: 1px solid var(--line);
}

.mobile-sheet__mode {
  padding: 10px 16px;
  border-bottom: 1px solid var(--line);
}

.mobile-sheet__row {
  display: flex;
  align-items: center;
}

.mobile-sheet__sub {
  flex-shrink: 0;
  margin-right: 16px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--line-2);
  border-radius: 8px;
  background: #fff;
  color: var(--ink-2);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.mobile-sheet__panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line);
}

.mobile-sheet__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid var(--line-2);
  border-radius: 8px;
  background: #fff;
  color: var(--ink-2);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.mobile-sheet__panel-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}

.mobile-sheet__body--panel {
  padding: 12px 16px 16px;
}

.inv-layout__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.mobile-sheet__tabs {
  display: flex;
  border-bottom: 1px solid var(--line);
}

.mobile-tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-4);
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s, box-shadow 0.15s;
}

.mobile-tab-btn--active {
  color: var(--ink);
  box-shadow: inset 0 -2px 0 var(--ink);
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
  color: var(--ink-2);
  transition: background 0.15s;
  text-align: left;
  font-family: inherit;
}

.mobile-sheet__item:hover {
  background: var(--sunken);
}

.mobile-sheet__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--sunken);
  border-radius: 10px;
  color: var(--ink-3);
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
  color: var(--line-2);
  flex-shrink: 0;
}

.mobile-sheet__footer {
  display: flex;
  gap: 8px;
  padding: 12px 20px 20px;
  border-top: 1px solid var(--line);
}

.mobile-sheet__footer > * {
  flex: 1 1 0;
  min-width: 0;
}

.mobile-sheet__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 10px;
  border: 1px solid var(--line-2);
  border-radius: 12px;
  background: #fff;
  color: var(--ink-2);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

/* INV-501: task groups in the sheet, as on the sidebar */
.mobile-sheet__group-title {
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 12px 20px 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.mobile-sheet__group-badge {
  padding: 0 6px;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 10px;
  letter-spacing: 0;
  text-transform: none;
}

.mobile-sheet__hidden {
  padding: 0 6px;
  border: 1px dashed currentColor;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: var(--neutral-600, var(--ink-3));
}

.mobile-sheet__toggle {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 26px;
  margin-right: 16px;
  padding: 0;
  border: none;
  border-radius: 13px;
  background: var(--line-2);
  cursor: pointer;
  transition: background 0.2s;
}

.mobile-sheet__toggle--on {
  background: #059669;
}

.mobile-sheet__toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.mobile-sheet__toggle--on .mobile-sheet__toggle-knob {
  transform: translateX(18px);
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
