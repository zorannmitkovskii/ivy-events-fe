<template>
  <aside class="edit-sidebar">
    <header class="edit-sidebar__header">
      <div class="edit-sidebar__header-left">
        <button
          class="save-btn"
          :class="{ 'save-btn--active': dirty }"
          :disabled="!dirty"
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
          class="preview-btn"
          :class="{ 'preview-btn--active': previewMode === 'mobile' }"
          :title="t('editSection.mobile')"
          @click="emit('set-preview', 'mobile')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        </button>
        <button
          class="preview-btn"
          :class="{ 'preview-btn--active': previewMode === 'tablet' }"
          :title="t('editSection.tablet')"
          @click="emit('set-preview', 'tablet')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        </button>
        <button
          class="preview-btn"
          :class="{ 'preview-btn--active': previewMode === 'desktop' }"
          :title="t('editSection.desktop')"
          @click="emit('set-preview', 'desktop')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Tab bar -->
    <div class="edit-sidebar__tabs">
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'info' }"
        @click="switchTab('info')"
      >
        {{ t('editSection.info') }}
      </button>
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'sections' }"
        @click="switchTab('sections')"
      >
        {{ t('editSection.sections') }}
      </button>
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'style' }"
        @click="switchTab('style')"
      >
        {{ t('editSection.style') }}
      </button>
    </div>

    <div class="edit-sidebar__body">
      <!-- Info panel -->
      <div v-if="activeTab === 'info'" class="info-panel-slot">
        <slot name="info-panel" />
      </div>

      <template v-else>
      <div v-for="s in filteredSections" :key="s.key" class="accordion-section">
        <!-- Accordion header -->
        <div
          class="accordion-header"
          :class="{ 'accordion-header--active': activeSection === s.key }"
          @click="emit('toggle-section', s.key)"
        >
          <span class="accordion-icon" v-html="s.icon"></span>
          <span class="accordion-label">{{ s.label }}</span>
          <button
            v-if="!s.mandatory"
            class="section-toggle"
            :class="{ 'section-toggle--on': sectionVisibility[s.key] !== false }"
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
          >
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        <!-- Accordion content (collapsible) -->
        <Transition name="accordion">
          <div v-if="activeSection === s.key" class="accordion-content">
            <div v-if="showLayoutTab && s.tab === 'sections'" class="sub-tab-bar">
              <button class="sub-tab-btn" :class="{ 'sub-tab-btn--active': activeSubTab === 'content' }" @click="activeSubTab = 'content'">{{ t('editSection.contentTab') }}</button>
              <button class="sub-tab-btn" :class="{ 'sub-tab-btn--active': activeSubTab === 'layout' }" @click="activeSubTab = 'layout'">{{ t('editSection.layoutTab') }}</button>
            </div>
            <slot :name="s.key" :sub-tab="s.tab === 'sections' ? activeSubTab : 'content'" />
          </div>
        </Transition>
      </div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { provide, ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";

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
});

const emit = defineEmits(["toggle-section", "toggle-visibility", "save", "set-preview"]);

const activeTab = ref('info');
const activeSubTab = ref('content');

const filteredSections = computed(() =>
  props.sections.filter(s => (s.tab || 'sections') === activeTab.value)
);

// When active section changes, switch to the correct tab and reset sub-tab
watch(() => props.activeSection, (key) => {
  activeSubTab.value = 'content';
  if (!key) return;
  const section = props.sections.find(s => s.key === key);
  if (section) {
    const tab = section.tab || 'sections';
    if (activeTab.value !== tab) activeTab.value = tab;
  }
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
  border-left: 1px solid #e5e7eb;
  overflow: hidden;
}

.edit-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  gap: 8px;
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

.save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  color: #9ca3af;
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

.preview-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s;
}

.preview-btn:hover {
  border-color: #9ca3af;
  color: #374151;
}

.preview-btn--active {
  border-color: #374151;
  background: #f3f4f6;
  color: #374151;
}

/* Tab bar */
.edit-sidebar__tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.15s, box-shadow 0.15s;
  font-family: inherit;
  position: relative;
}

.tab-btn:hover {
  color: #6b7280;
}

.tab-btn--active {
  color: #1f2937;
  box-shadow: inset 0 -2px 0 #1f2937;
}

.edit-sidebar__body {
  flex: 1;
  overflow-y: auto;
}

.accordion-section {
  border-bottom: 1px solid #e5e7eb;
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
  color: #374151;
  transition: background 0.15s;
  font-family: inherit;
}

.accordion-header:hover {
  background: #f9fafb;
}

.accordion-header--active {
  background: #f3f4f6;
}

.accordion-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #6b7280;
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

.section-toggle {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  border: none;
  background: #d1d5db;
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
  color: #9ca3af;
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
  border-bottom: 1px solid #e5e7eb;
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
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.15s, box-shadow 0.15s;
  font-family: inherit;
  position: relative;
}

.sub-tab-btn:hover {
  color: #6b7280;
}

.sub-tab-btn--active {
  color: #1f2937;
  box-shadow: inset 0 -2px 0 #1f2937;
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
