<template>
  <InvitationEditLayout
    :edit-mode="isEditMode"
    :sections="orderedSections"
    :active-section="activeRootSection"
    :dirty="dirty"
    :preview-mode="previewMode"
    :statuses="sectionStatuses"
    :section-visibility="sectionVisibility"
    :show-layout-tab="isBuilder"
    @toggle-section="toggleSection"
    @toggle-visibility="(k) => { toggleVisibility(k); markDirty(); }"
    @save="onGlobalSave"
    @set-preview="previewMode = $event"
    @select-section="selectSection"
  >
  <div ref="rootRef" class="unified-invitation" :class="[preset.id, { 'edit-active': isEditMode }]" :style="rootStyle">
    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <div v-show="!loading">

    <!-- ENTRY OVERLAY -->
    <InvitationEntry
      v-if="isSectionVisible('entry')"
      ref="entryRef"
      :type="entryType"
      :design="entryDesign"
      :visible="showEntry"
      :photos="config.galleryPhotos"
      :bride-name="config.brideName"
      :groom-name="config.groomName"
      :wedding-date="config.weddingDate"
      :tap-label="t('invitation.tapToOpen')"
      :is-edit-mode="isEditMode"
      :edit-label="t('editSection.entry')"
      @enter="showEntry = false"
      @edit="openModal('entry')"
    />

    <!-- Hero -->
    <div v-show="!entryActive" data-edit-section="hero" :class="{ 'section--editing': isEditMode && activeRootSection === 'hero' }" style="position:relative;">
    <SectionEditButton :visible="isEditMode" :label="t('editSection.hero')" variant="dark" @click="selectSection('hero')" />
    <component
      v-if="heroComponent"
      :is="heroComponent"
      v-bind="heroProps"
    />
    </div>

    <!-- Decorations -->
    <template v-for="dec in preset.decorations" :key="dec">
      <DiamondDivider v-if="dec === 'diamond-divider'" v-show="!entryActive" />
      <OrnamentDivider v-if="dec === 'ornament-divider'" v-show="!entryActive" />
    </template>

    <!-- Event Details (dynamic component) -->
    <section v-show="!entryActive" v-if="isSectionVisible('details')" data-edit-section="details" :class="['section section--alt', { 'section--editing': isEditMode && activeRootSection === 'details' }]" data-reveal style="position:relative;">
      <SectionEditButton :visible="isEditMode" :label="t('editSection.details')" @click="selectSection('details')" />
      <div class="section-inner">
        <component
          :is="detailsComponent"
          :title="t('invitation.eventDetails')"
          :ceremony-label="t('invitation.ceremony')"
          :reception-label="t('invitation.reception')"
          :location-label="t('invitation.location')"
          :map-label="t('invitation.viewMap')"
          :ceremony-venue="config.ceremonyVenue"
          :ceremony-date="config.ceremonyDate"
          :ceremony-time="config.ceremonyTime"
          :ceremony-map-url="config.ceremonyMapUrl"
          :reception-venue="config.receptionVenue"
          :reception-date="config.receptionDate"
          :reception-time="config.receptionTime"
          :reception-map-url="config.receptionMapUrl"
          :venue="config.venue"
          :location-map-url="config.locationMapUrl"
          :countdown-date="config.weddingDateTime"
          :countdown-label="t('invitation.countdownLabel')"
          :card-bg="contrastCardBg"
          :card-border="cardStyle.cardBorder"
          :card-radius="cardStyle.cardRadius"
          :card-shadow="shadows.card"
          :accent-color="palette.accent"
          :secondary-color="palette.secondary"
          :text-color="palette.text"
          :divider-color="palette.secondary"
          :heading-font="fonts.heading"
          :body-font="fonts.body"
        />
      </div>
    </section>

    <!-- Schedule -->
    <section v-if="(isEditMode || (showAgenda && !isPrivate)) && isSectionVisible('agendaList')" v-show="!entryActive" data-edit-section="agendaList" :class="['section section--base', { 'section--editing': isEditMode && activeRootSection === 'agendaList' }]" data-reveal style="position:relative;">
      <SectionEditButton :visible="isEditMode" :label="t('editSection.agenda')" @click="selectSection('agendaList')" />
      <div class="section-inner">
        <component
          v-if="scheduleComponent"
          :is="scheduleComponent"
          :title="t('invitation.schedule')"
          :events="config.scheduleEvents"
          :divider-color="palette.secondary"
          :heading-font="fonts.heading"
          :body-font="fonts.body"
        />
      </div>
    </section>

    <!-- Our Story -->
    <section v-if="(isEditMode || showOurStory) && isSectionVisible('ourStoryList')" v-show="!entryActive" data-edit-section="ourStoryList" :class="['section section--alt', { 'section--editing': isEditMode && activeRootSection === 'ourStoryList' }]" data-reveal style="position:relative;">
      <SectionEditButton :visible="isEditMode" :label="t('editSection.ourStory')" @click="selectSection('ourStoryList')" />
      <div class="section-inner">
        <component
          v-if="storyComponent"
          :is="storyComponent"
          :title="t('invitation.ourStory')"
          :stories="config.stories"
          :photos="config.storyPhotos || []"
          :image-url="config.storyImageUrl || ''"
          :signature-url="config.signatureUrl || ''"
          :paragraphs="config.storyParagraphs || []"
          :divider-color="palette.secondary"
          :heading-font="fonts.heading"
          :body-font="fonts.body"
        />
      </div>
    </section>

    <!-- RSVP -->
    <section v-show="!entryActive" v-if="isSectionVisible('rsvp')" id="rsvp-section" data-edit-section="rsvp" :class="['section section--base', { 'section--editing': isEditMode && activeRootSection === 'rsvp' }]" data-reveal style="position:relative;">
      <SectionEditButton :visible="isEditMode" :label="t('editSection.rsvp')" @click="selectSection('rsvp')" />
      <div class="section-inner">
        <div class="rsvp-header">
          <h2 class="section-title">{{ t('invitation.rsvp') }}</h2>
          <div class="section-divider"></div>
          <p class="rsvp-subtitle">{{ config.rsvpMessage }}</p>
        </div>

        <div class="rsvp-wrapper">
          <RsvpForm
            title=""
            :name-label="t('invitation.fullName')"
            :name-placeholder="t('invitation.namePlaceholder')"
            :add-guest-label="t('invitation.addGuest')"
            :accept-label="t('invitation.joyfullyAccept')"
            :decline-label="t('invitation.regretfullyDecline')"
            :message-label="t('invitation.yourMessage')"
            :message-placeholder="t('invitation.messagePlaceholder')"
            :submit-label="t('invitation.sendRsvp')"
            :accent-color="palette.accent"
            :accept-color="palette.accent"
            :decline-color="palette.secondary"
            :button-bg="buttonStyle.bg"
            :button-text="buttonStyle.text"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            :border-radius="rsvpConfig.borderRadius"
            :max-guests="rsvpConfig.maxGuests"
            @submit="onRsvpSubmit"
          />
        </div>
      </div>
    </section>

    </div>
  </div>

    <!-- Info Panel -->
    <template v-if="isEditMode" #info-panel>
      <EditInfoPanel
        :bride-name="config.brideName"
        :groom-name="config.groomName"
        :wedding-date="config.weddingDateTime ? config.weddingDateTime.slice(0, 10) : ''"
        :location="backendData?.event?.location || null"
        @change="onInfoChange"
      />
    </template>

    <!-- Entry -->
    <template v-if="isEditMode" #section-entry="{ subTab }">
      <EditEntryModal
        v-if="subTab === 'content'"
        :open="true"
        :live-edit="true"
        :current-type="entryType"
        :current-design="entryDesign"
        @close="toggleSection('entry')"
        @change="onEntryChange"
      />
      <SectionLayoutPicker v-if="subTab === 'layout'" :layouts="SECTION_LAYOUTS.entry || []" :current="sectionLayouts.entry" @select="setLayout('entry', $event); markDirty()" />
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="entry" :visible="isSectionVisible('entry')" :anchor-id="sectionAdvancedState.entry?.anchorId || ''" :animation="sectionAdvancedState.entry?.animation || 'none'" :overrides="sectionOverrides.entry || null" @update="onAdvancedUpdate('entry', $event)" />
    </template>

    <!-- Hero -->
    <template v-if="isEditMode" #section-hero="{ subTab }">
      <EditHeroModal
        v-if="subTab === 'content'"
        :open="true"
        :live-edit="true"
        :event="heroEventData"
        @close="toggleSection('hero')"
        @change="onHeroChange"
        @updated="refreshAllData"
      />
      <div v-if="subTab === 'layout'" class="family-picker-wrap">
        <p class="family-picker-label">Hero Style</p>
        <SectionLayoutPicker :layouts="HERO_FAMILY_OPTIONS" :current="heroFamily" @select="onHeroFamilyChange($event)" />
      </div>
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="hero" :visible="isSectionVisible('hero')" :anchor-id="sectionAdvancedState.hero?.anchorId || ''" :animation="sectionAdvancedState.hero?.animation || 'none'" :overrides="sectionOverrides.hero || null" @update="onAdvancedUpdate('hero', $event)" />
    </template>

    <!-- Details -->
    <template v-if="isEditMode" #section-details="{ subTab }">
      <template v-if="subTab === 'content'">
        <EditDetailsModal
          v-if="!editingItem && activeModal === 'details'"
          :open="true"
          :items="eventDetails.items.value"
          :max-items="2"
          no-add
          @close="toggleSection('details')"
          @add="onDetailsAdd"
          @delete="onDetailsDelete"
          @update="handleEventDetailUpdate"
        />
        <AddEventDetailModal
          v-if="editingItem || activeModal === 'eventDetail'"
          :open="true"
          sub-modal
          :item="editingItem"
          :items="eventDetails.items.value"
          @close="closeModal"
          @submit="handleEventDetailSave"
          @delete="handleEventDetailDelete"
        />
      </template>
      <SectionLayoutPicker v-if="subTab === 'layout'" :layouts="SECTION_LAYOUTS.details || []" :current="sectionLayouts.details" @select="setLayout('details', $event); markDirty()" />
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="details" :visible="isSectionVisible('details')" :anchor-id="sectionAdvancedState.details?.anchorId || ''" :animation="sectionAdvancedState.details?.animation || 'none'" :overrides="sectionOverrides.details || null" @update="onAdvancedUpdate('details', $event)" />
    </template>

    <!-- Agenda -->
    <template v-if="isEditMode" #section-agendaList="{ subTab }">
      <template v-if="subTab === 'content'">
        <EditAgendaModal
          v-if="!editingItem && activeModal === 'agendaList'"
          :open="true"
          :items="agenda.items.value"
          @close="toggleSection('agendaList')"
          @add="onAgendaAdd"
          @delete="onAgendaDelete"
          @update="handleAgendaUpdate"
        />
        <AddAgendaItemModal
          v-if="editingItem || activeModal === 'agendaItem'"
          :open="true"
          sub-modal
          :item="editingItem"
          :items="agenda.items.value"
          @close="closeModal"
          @submit="handleAgendaSave"
          @delete="handleAgendaDelete"
        />
      </template>
      <div v-if="subTab === 'layout'" class="family-picker-wrap">
        <p class="family-picker-label">Schedule Style</p>
        <SectionLayoutPicker :layouts="SCHEDULE_FAMILY_OPTIONS" :current="scheduleFamily" @select="onScheduleFamilyChange($event)" />
      </div>
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="agendaList" :visible="isSectionVisible('agendaList')" :anchor-id="sectionAdvancedState.agendaList?.anchorId || ''" :animation="sectionAdvancedState.agendaList?.animation || 'none'" :overrides="sectionOverrides.agendaList || null" @update="onAdvancedUpdate('agendaList', $event)" />
    </template>

    <!-- Our Story -->
    <template v-if="isEditMode" #section-ourStoryList="{ subTab }">
      <template v-if="subTab === 'content'">
        <EditOurStoryModal
          v-if="!editingItem && activeModal === 'ourStoryList'"
          :open="true"
          :items="ourStory.items.value"
          :field-config="storyFieldConfig"
          @close="toggleSection('ourStoryList')"
          @add="onOurStoryAdd"
          @delete="onOurStoryDelete"
          @update="handleOurStoryUpdate"
        />
        <AddOurStoryModal
          v-if="editingItem || activeModal === 'ourStoryItem'"
          :open="true"
          sub-modal
          :item="editingItem"
          :items="ourStory.items.value"
          @close="closeModal"
          @submit="handleOurStorySave"
          @delete="handleOurStoryDelete"
        />
      </template>
      <div v-if="subTab === 'layout'" class="family-picker-wrap">
        <p class="family-picker-label">Story Style</p>
        <SectionLayoutPicker :layouts="STORY_FAMILY_OPTIONS" :current="storyFamily" @select="onStoryFamilyChange($event)" />
      </div>
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="ourStoryList" :visible="isSectionVisible('ourStoryList')" :anchor-id="sectionAdvancedState.ourStoryList?.anchorId || ''" :animation="sectionAdvancedState.ourStoryList?.animation || 'none'" :overrides="sectionOverrides.ourStoryList || null" @update="onAdvancedUpdate('ourStoryList', $event)" />
    </template>

    <!-- Our Story Images (separate section — hidden for coastal since images are per-card) -->
    <template v-if="isEditMode" #section-ourStoryImages>
      <div v-if="storyFamily !== 'coastal'" class="story-images-panel">
        <!-- Single image for Parisian -->
        <div v-if="storyFamily === 'parisian'" class="story-image-upload">
          <p class="story-image-label">{{ t('editOurStory.storyImage') || 'Story Image' }}</p>
          <div v-if="storyImagePreview || config.storyImageUrl" class="story-image-preview-wrap">
            <img :src="storyImagePreview || config.storyImageUrl" alt="" class="story-image-preview" />
            <button type="button" class="story-image-change-btn" @click="$refs.storyImageInput?.click()">
              {{ t('ourStory.form.changeImage') || 'Change' }}
            </button>
          </div>
          <div v-else class="story-image-drop" @click="$refs.storyImageInput?.click()">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>{{ t('ourStory.form.clickToUpload') || 'Click to upload' }}</span>
          </div>
          <input ref="storyImageInput" type="file" accept="image/*" style="display:none" @change="onSingleStoryImage" />
        </div>

        <!-- Multi-image grid — always shows all slots -->
        <template v-else>
          <div class="story-images-header-row">
            <span class="story-image-label">{{ t('editOurStory.photos') }}</span>
          </div>

          <div class="story-images-grid-edit">
            <div
              v-for="(slot, idx) in storyImageSlots"
              :key="'slot-' + idx"
              class="story-img-thumb"
              :class="{ 'story-img-thumb--empty': !slot.url }"
              @click="triggerSlotUpload(idx)"
            >
              <img v-if="slot.url" :src="slot.url" alt="" />
              <template v-else>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span class="placeholder-label">{{ t('editOurStory.photos') }} {{ idx + 1 }}</span>
              </template>
              <span v-if="slot.url && slot.isCustom" class="story-img-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            </div>
          </div>
          <input ref="slotFileInput" type="file" accept="image/*" style="display:none" @change="onSlotFileSelected" />
        </template>
      </div>
    </template>

    <!-- Collage (shown when gallery entry selected) -->
    <template v-if="isEditMode" #section-collage>
      <div class="story-images-panel">
        <div class="story-images-header-row">
          <span class="story-image-label">{{ t('editSection.collage') }} ({{ collageSlotImages.length }}/6)</span>
        </div>
        <div class="story-images-grid-edit">
          <div
            v-for="(slot, idx) in collageSlots"
            :key="'collage-' + idx"
            class="story-img-thumb"
            :class="{ 'story-img-thumb--empty': !slot.url }"
            @click="triggerCollageUpload(idx)"
          >
            <img v-if="slot.url" :src="slot.url" alt="" />
            <template v-else>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <span class="placeholder-label">{{ idx + 1 }}</span>
            </template>
            <span v-if="slot.isCustom" class="story-img-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </div>
        </div>
        <input ref="collageFileInput" type="file" accept="image/*" style="display:none" @change="onCollageSlotSelected" />
      </div>
    </template>

    <!-- RSVP -->
    <template v-if="isEditMode" #section-rsvp="{ subTab }">
      <EditRsvpModal
        v-if="subTab === 'content'"
        :open="true"
        :live-edit="true"
        :rsvp-deadline="rsvpConfig.deadline"
        :max-guests="rsvpConfig.maxGuests"
        :show-dietary="rsvpConfig.showDietary"
        :border-radius="rsvpConfig.borderRadius"
        :allow-plus-one="rsvpConfig.allowPlusOne"
        :show-child="rsvpConfig.showChild"
        :contact-method="rsvpConfig.contactMethod"
        :custom-questions="rsvpConfig.customQuestions"
        :require-last-name="rsvpConfig.requireLastName"
        @close="toggleSection('rsvp')"
        @change="onRsvpChange"
      />
      <SectionLayoutPicker v-if="subTab === 'layout'" :layouts="SECTION_LAYOUTS.rsvp || []" :current="sectionLayouts.rsvp" @select="setLayout('rsvp', $event); markDirty()" />
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="rsvp" :visible="isSectionVisible('rsvp')" :anchor-id="sectionAdvancedState.rsvp?.anchorId || ''" :animation="sectionAdvancedState.rsvp?.animation || 'none'" :overrides="sectionOverrides.rsvp || null" @update="onAdvancedUpdate('rsvp', $event)" />
    </template>

    <!-- Style tab sections (no sub-tabs) -->
    <template v-if="isEditMode" #section-colors>
      <div class="theme-palette-picker">
        <!-- Preset palettes -->
        <p class="palette-picker-label">{{ t('editSection.chooseTheme') }}</p>
        <div class="palette-grid">
          <button
            v-for="p in THEME_PALETTES"
            :key="p.name"
            class="palette-card"
            :class="{
              'palette-card--active': activePaletteName === p.name,
              'palette-card--dark': p.dark,
              'palette-card--original': p.original,
            }"
            :style="{ background: p.rootBg }"
            @click="applyThemePalette(p)"
          >
            <span class="palette-accent" :style="{ background: p.accent }"></span>
            <span class="palette-info">
              <span class="palette-name" :style="{ color: p.text }">{{ p.original ? (preset.name + ' (Default)') : p.name }}</span>
              <span class="palette-tag" :style="{ color: p.secondary }">{{ p.original ? 'Original' : (p.dark ? 'Dark Luxe' : 'Pastel') }}</span>
            </span>
          </button>
        </div>

        <!-- Individual color overrides -->
        <div class="color-overrides">
          <p class="palette-picker-label" style="margin-top:20px">{{ t('editSection.customColors') || 'Custom Colors' }}</p>
          <div class="color-field" v-for="f in individualColorFields" :key="f.key">
            <label class="color-field-label">{{ f.label }}</label>
            <div class="color-field-input">
              <input type="color" :value="f.value" @input="onIndividualColorChange(f.key, $event.target.value)" class="color-input" />
              <input type="text" :value="f.value" @change="onIndividualColorChange(f.key, $event.target.value)" class="hex-input" maxlength="7" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="isEditMode" #section-fonts>
      <EditFontsModal
        :open="true"
        :live-edit="true"
        :current-heading="extractFontName(fonts.heading)"
        :current-body="extractFontName(fonts.body)"
        @close="toggleSection('fonts')"
        @change="onFontsChange"
      />
    </template>

    <!-- buttons, background, spacing removed — theme palette handles all styling -->
  </InvitationEditLayout>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { DESIGN_PRESETS } from '@/config/designPresets/index.js';
import { useWeddingInvitation } from '@/composables/useWeddingInvitation';
import { HERO_COMPONENTS, DETAILS_COMPONENTS, SCHEDULE_COMPONENTS, STORY_COMPONENTS } from '@/components/invitations/wedding/heroes/index.js';

// Shared component imports
import InvitationEditLayout from '@/components/invitations/shared/InvitationEditLayout.vue';
import InvitationEntry from '@/components/invitations/entries/InvitationEntry.vue';
import RsvpForm from '@/components/invitations/shared/RsvpForm.vue';
import DiamondDivider from '@/components/invitations/wedding/decorations/DiamondDivider.vue';
import OrnamentDivider from '@/components/invitations/wedding/decorations/OrnamentDivider.vue';

// Edit modal imports
import EditEntryModal from '@/components/modals/EditEntryModal.vue';
import EditColorsModal from '@/components/modals/EditColorsModal.vue';
import EditFontsModal from '@/components/modals/EditFontsModal.vue';
import EditHeroModal from '@/components/modals/EditHeroModal.vue';
import EditDetailsModal from '@/components/modals/EditDetailsModal.vue';
import AddEventDetailModal from '@/components/modals/AddEventDetailModal.vue';
import EditAgendaModal from '@/components/modals/EditAgendaModal.vue';
import AddAgendaItemModal from '@/components/modals/AddAgendaItemModal.vue';
import EditOurStoryModal from '@/components/modals/EditOurStoryModal.vue';
import AddOurStoryModal from '@/components/modals/AddOurStoryModal.vue';
import EditRsvpModal from '@/components/modals/EditRsvpModal.vue';
import SectionLayoutPicker from '@/components/invitations/shared/SectionLayoutPicker.vue';
import SectionAdvanced from '@/components/invitations/shared/SectionAdvanced.vue';
import EditInfoPanel from '@/components/invitations/shared/EditInfoPanel.vue';
import SectionEditButton from '@/components/invitations/shared/SectionEditButton.vue';
import { invitationImagesService } from '@/services/invitationImages.service.js';

const route = useRoute();
const designId = computed(() => route.params.design || route.query.design || 'coastal-breeze');
const isBuilder = computed(() => designId.value === 'my-wedding');
const preset = computed(() => {
  if (isBuilder.value) return DESIGN_PRESETS['coastal-breeze'];
  return DESIGN_PRESETS[designId.value] || DESIGN_PRESETS['coastal-breeze'];
});

// Destructure everything from the master composable
const inv = useWeddingInvitation(preset.value);
// Re-export for template usage
const {
  rootRef, entryRef, loading, config, palette, fonts, buttonStyle, cardStyle, spacingPreset, rsvpConfig,
  showEntry, entryActive, showAgenda, showOurStory, entryType, entryDesign, rootBg,
  heroFamily, scheduleFamily, storyFamily,
  onHeroFamilyChange, onScheduleFamilyChange, onStoryFamilyChange,
  isEditMode, activeModal, activeRootSection, editingItem,
  openModal, closeModal, selectSection,
  dirty, previewMode, markDirty, saving,
  orderedSections, sectionVisibility, sectionLayouts, sectionOverrides, sectionAdvancedState,
  isSectionVisible, toggleVisibility, toggleSection,
  SIDEBAR_SECTIONS, SECTION_LAYOUTS, sectionStatuses,
  eventId, locale, isPrivate, backendData,
  agenda, eventDetails, ourStory,
  heroEventData, heroFile, ourStoryFiles, collageFiles,
  rootStyle, colorFields, shadows, contrastCardBg, PALETTE_PRESETS, SHADOW_MAP, SPACING_MAP,
  onEntryChange, onHeroChange, onInfoChange,
  onColorsChange, onFontsChange, onRsvpChange,
  onButtonsChange, onBackgroundChange, onSpacingChange,
  onAdvancedUpdate, onGlobalSave,
  onDetailsAdd, onDetailsEdit, onDetailsDelete,
  onAgendaAdd, onAgendaEdit, onAgendaDelete,
  onOurStoryAdd, onOurStoryEdit, onOurStoryDelete,
  onOurStoryFiles, onCollageFiles,
  onRsvpSubmit, refreshAllData, t, extractFontName,
  setLayout,
  handleEventDetailSave, handleEventDetailUpdate, handleEventDetailDelete,
  handleAgendaSave, handleAgendaUpdate, handleAgendaDelete,
  handleOurStorySave, handleOurStoryUpdate, handleOurStoryDelete,
  OUR_STORY_FIELD_CONFIG,
} = inv;

// Reset all state when design changes (e.g. navigating from coastal → persian)
watch(preset, (newPreset) => {
  inv.resetToPreset(newPreset);
});

// Lock scroll while entry overlay is active
watch(entryActive, (active) => {
  if (active) {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  } else {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }
}, { immediate: true });

// Max story images per family
const STORY_IMAGE_LIMITS = { parisian: 1, coastal: 0, persian: 4, collage: 4, chateau: 0 };
const storyImageMax = computed(() => STORY_IMAGE_LIMITS[storyFamily.value] || 4);

// Single story image upload (Parisian family)
const storyImagePreview = ref('');

function onSingleStoryImage(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  storyImagePreview.value = URL.createObjectURL(file);
  config.storyImageUrl = storyImagePreview.value;
  // Replace (not append) the single story image
  ourStoryFiles.value = [file];
}

// Multi-image story management — slot-based, always shows all slots
// customSlots tracks per-index overrides: { [index]: blobUrl }
const customSlotImages = ref({});
const activeSlotIndex = ref(0);

// Default placeholder images from config (set on init)
const defaultStoryPhotos = config.storyPhotos.map(p => p.url);

// Build fixed-size slot array: custom > uploaded > default > empty
const storyImageSlots = computed(() => {
  const max = storyImageMax.value;
  const uploaded = ourStory.images?.value || [];
  const slots = [];
  for (let i = 0; i < max; i++) {
    const custom = customSlotImages.value[i];
    const fromApi = uploaded[i];
    const fallback = defaultStoryPhotos[i];
    slots.push({
      url: custom || fromApi || fallback || '',
      isCustom: !!custom,
      isUploaded: !!fromApi && !custom,
    });
  }
  return slots;
});

// Sync slots to preview config live
watch(storyImageSlots, (slots) => {
  const urls = slots.map(s => s.url).filter(Boolean);
  if (urls.length) {
    config.storyPhotos = urls.map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
    if (!storyImagePreview.value) {
      config.storyImageUrl = urls[0];
    }
  }
}, { immediate: true, deep: true });

const slotFileInput = ref(null);

function triggerSlotUpload(idx) {
  activeSlotIndex.value = idx;
  if (slotFileInput.value) { slotFileInput.value.value = ''; slotFileInput.value.click(); }
}

// Track files by slot index so replacing a slot doesn't duplicate
const storyFilesBySlot = {};

function onSlotFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const idx = activeSlotIndex.value;
  const url = URL.createObjectURL(file);
  customSlotImages.value = { ...customSlotImages.value, [idx]: url };
  storyFilesBySlot[idx] = file;
  // Rebuild ourStoryFiles from slots in order
  ourStoryFiles.value = Object.keys(storyFilesBySlot)
    .sort((a, b) => a - b)
    .map(k => storyFilesBySlot[k]);
  markDirty();
  if (e.target) e.target.value = '';
}

// Collage slot-based management (same approach as story images)
const COLLAGE_MAX = 6;
const defaultCollagePhotos = config.galleryPhotos.map(p => p.url);
const customCollageImages = ref({});
const activeCollageIndex = ref(0);
const collageFileInput = ref(null);

const collageSlotImages = computed(() => {
  const uploaded = []; // from API after save — populated by loadGalleryImages
  const slots = [];
  for (let i = 0; i < COLLAGE_MAX; i++) {
    slots.push(customCollageImages.value[i] || uploaded[i] || defaultCollagePhotos[i] || '');
  }
  return slots.filter(Boolean);
});

const collageSlots = computed(() => {
  const slots = [];
  for (let i = 0; i < COLLAGE_MAX; i++) {
    const custom = customCollageImages.value[i];
    const fallback = defaultCollagePhotos[i];
    const url = custom || fallback || '';
    slots.push({ url, isCustom: !!custom });
  }
  return slots;
});

// Sync collage slots to preview config live
watch(collageSlots, (slots) => {
  const urls = slots.map(s => s.url).filter(Boolean);
  if (urls.length) {
    config.galleryPhotos = urls.map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
  }
}, { deep: true });

function triggerCollageUpload(idx) {
  activeCollageIndex.value = idx;
  if (collageFileInput.value) { collageFileInput.value.value = ''; collageFileInput.value.click(); }
}

const collageFilesBySlot = {};

function onCollageSlotSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const idx = activeCollageIndex.value;
  const url = URL.createObjectURL(file);
  customCollageImages.value = { ...customCollageImages.value, [idx]: url };
  collageFilesBySlot[idx] = file;
  // Rebuild collageFiles from slots in order
  collageFiles.value = Object.keys(collageFilesBySlot)
    .sort((a, b) => a - b)
    .map(k => collageFilesBySlot[k]);
  markDirty();
  if (e.target) e.target.value = '';
}

// Dynamic section components - reactive to user selection
const heroComponent = computed(() => HERO_COMPONENTS[heroFamily.value] || null);
const detailsComponent = computed(() => DETAILS_COMPONENTS[heroFamily.value] || DETAILS_COMPONENTS.coastal);
const scheduleComponent = computed(() => SCHEDULE_COMPONENTS[scheduleFamily.value] || null);
const storyComponent = computed(() => STORY_COMPONENTS[storyFamily.value] || null);

// --- Theme palettes: original preset + 10 custom ---
const ORIGINAL_PALETTE = reactive({
  name: 'Original',
  accent: preset.value.palette.accent,
  secondary: preset.value.palette.secondary,
  text: preset.value.palette.text,
  rootBg: preset.value.rootBg || '#fff',
  cardBg: preset.value.cardStyle.cardBg,
  sectionBg: preset.value.cardStyle.sectionBg,
  dark: false,
  original: true,
});

// Sync ORIGINAL_PALETTE when preset changes (design switch)
watch(preset, (p) => {
  Object.assign(ORIGINAL_PALETTE, {
    accent: p.palette.accent,
    secondary: p.palette.secondary,
    text: p.palette.text,
    rootBg: p.rootBg || '#fff',
    cardBg: p.cardStyle.cardBg,
    sectionBg: p.cardStyle.sectionBg,
  });
  activePaletteName.value = 'Original';
});

const THEME_PALETTES = [
  ORIGINAL_PALETTE,
  // Dark (3)
  { name: 'Black + Gold', accent: '#C8A24D', secondary: '#CDB27A', text: '#F7F2E8', rootBg: '#111111', cardBg: '#1A1A1A', sectionBg: '#161616', dark: true },
  { name: 'Deep Green + Gold', accent: '#C8A24D', secondary: '#C6B389', text: '#F6F1E8', rootBg: '#1C2520', cardBg: '#263129', sectionBg: '#222C25', dark: true },
  { name: 'Deep Blue + Gold', accent: '#D1A95A', secondary: '#CFBE95', text: '#F8F5EE', rootBg: '#1B2432', cardBg: '#243041', sectionBg: '#202B3A', dark: true },
  // Pastel (7)
  { name: 'Blush Pink', accent: '#EF7D92', secondary: '#7E6C70', text: '#322A2C', rootBg: '#F7EFF1', cardBg: '#F1E3E7', sectionBg: '#F4E9EC', dark: false },
  { name: 'Champagne Rose', accent: '#D9897D', secondary: '#8A736D', text: '#3A312F', rootBg: '#FAF4EE', cardBg: '#F3E6DE', sectionBg: '#F6EBE4', dark: false },
  { name: 'Sage Ivory', accent: '#A9B79A', secondary: '#6F776A', text: '#31372F', rootBg: '#F6F5EF', cardBg: '#EAE9DD', sectionBg: '#EEEDE3', dark: false },
  { name: 'Powder Blue', accent: '#7FA7C9', secondary: '#6C7885', text: '#2D3640', rootBg: '#F4F7FA', cardBg: '#E6EEF5', sectionBg: '#EBF1F7', dark: false },
  { name: 'Lavender', accent: '#A792C8', secondary: '#746E82', text: '#312E38', rootBg: '#F7F4FA', cardBg: '#ECE6F3', sectionBg: '#F0EBF6', dark: false },
  { name: 'Peach Cream', accent: '#E39B7A', secondary: '#8E7468', text: '#3B312D', rootBg: '#FFF6F0', cardBg: '#F9E7DA', sectionBg: '#FCEEE4', dark: false },
  { name: 'Taupe Rose', accent: '#D78490', secondary: '#7E6D6B', text: '#352E2D', rootBg: '#F5F2F0', cardBg: '#ECE2E1', sectionBg: '#F0E8E7', dark: false },
];

const activePaletteName = ref('Original');

function applyThemePalette(p) {
  activePaletteName.value = p.name;
  rootBg.value = p.rootBg;
  Object.assign(palette, { accent: p.accent, secondary: p.secondary, text: p.text });
  Object.assign(cardStyle, { sectionBg: p.sectionBg, cardBg: p.cardBg });
  Object.assign(buttonStyle, { bg: p.accent, text: p.dark ? '#111111' : '#ffffff' });
  // Reset button style for original
  if (p.original) {
    Object.assign(buttonStyle, { ...preset.value.buttonStyle });
  }
  markDirty();
}

function resetToOriginal() {
  applyThemePalette(ORIGINAL_PALETTE);
  Object.assign(fonts, { ...preset.value.fonts });
  heroFamily.value = preset.value.family;
  scheduleFamily.value = preset.value.family;
  storyFamily.value = preset.value.family;
  markDirty();
}

// --- Individual color overrides ---
const individualColorFields = computed(() => [
  { key: 'rootBg', label: t('editSection.background') || 'Background', value: rootBg.value },
  { key: 'accent', label: t('editSection.accentColor') || 'Accent', value: palette.accent },
  { key: 'secondary', label: t('editSection.secondaryColor') || 'Secondary', value: palette.secondary },
  { key: 'text', label: t('editSection.textColor') || 'Text', value: palette.text },
  { key: 'cardBg', label: t('editSection.cardBg') || 'Cards', value: cardStyle.cardBg },
  { key: 'sectionBg', label: t('editSection.sectionBg') || 'Sections', value: cardStyle.sectionBg },
]);

function hexLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function isDarkColor(hex) {
  return hex && hex.startsWith('#') && hex.length >= 7 && hexLuminance(hex) < 0.2;
}

function onIndividualColorChange(key, value) {
  if (!value || !value.startsWith('#')) return;
  activePaletteName.value = '';
  if (key === 'rootBg') {
    rootBg.value = value;
    // Auto-adjust text color for dark/light backgrounds
    if (isDarkColor(value)) {
      palette.text = '#F7F2E8';
      buttonStyle.text = '#111111';
    } else if (hexLuminance(value) > 0.5) {
      palette.text = '#1f2937';
      buttonStyle.text = '#ffffff';
    }
  }
  else if (key === 'cardBg') cardStyle.cardBg = value;
  else if (key === 'sectionBg') cardStyle.sectionBg = value;
  else palette[key] = value;
  markDirty();
}

// Family options for the style pickers
const HERO_FAMILY_OPTIONS = [
  { key: 'coastal', label: 'Split Image + Text', diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="28" height="44" rx="2" fill="#d1d5db"/><rect x="34" y="8" width="26" height="6" rx="1" fill="#9ca3af"/><rect x="34" y="18" width="26" height="10" rx="1" fill="#e5e7eb"/><rect x="34" y="34" width="18" height="6" rx="1" fill="#9ca3af"/></svg>' },
  { key: 'parisian', label: 'Full Image + Overlay', diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="60" height="44" rx="2" fill="#d1d5db"/><rect x="12" y="12" width="40" height="6" rx="1" fill="#9ca3af"/><rect x="16" y="22" width="32" height="4" rx="1" fill="#e5e7eb"/><rect x="20" y="32" width="24" height="6" rx="1" fill="#9ca3af"/></svg>' },
  { key: 'persian', label: 'Image + Glass Panel', diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="60" height="20" rx="2" fill="#d1d5db"/><rect x="10" y="26" width="44" height="18" rx="4" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/><rect x="18" y="30" width="28" height="4" rx="1" fill="#9ca3af"/><rect x="22" y="38" width="20" height="3" rx="1" fill="#9ca3af"/></svg>' },
  { key: 'editorial', label: 'Editorial Split', diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="28" height="44" rx="2" fill="#e5e7eb"/><rect x="10" y="10" width="12" height="16" rx="1" fill="#d1d5db"/><line x1="32" y1="2" x2="32" y2="46" stroke="#d1d5db" stroke-width="1"/><rect x="36" y="6" width="20" height="3" rx="1" fill="#9ca3af"/><rect x="36" y="12" width="24" height="6" rx="1" fill="#d1d5db"/><rect x="36" y="22" width="14" height="10" rx="1" fill="#9ca3af"/><rect x="36" y="38" width="22" height="5" rx="1" fill="#9ca3af"/></svg>' },
];

const SCHEDULE_FAMILY_OPTIONS = [
  { key: 'coastal', label: 'Card List', diagram: '<svg viewBox="0 0 64 48"><rect x="4" y="4" width="56" height="10" rx="2" fill="#d1d5db"/><rect x="4" y="18" width="56" height="10" rx="2" fill="#d1d5db"/><rect x="4" y="32" width="56" height="10" rx="2" fill="#d1d5db"/></svg>' },
  { key: 'parisian', label: 'Alternating Timeline', diagram: '<svg viewBox="0 0 64 48"><line x1="32" y1="4" x2="32" y2="44" stroke="#9ca3af" stroke-width="2"/><rect x="4" y="6" width="24" height="10" rx="2" fill="#d1d5db"/><rect x="36" y="20" width="24" height="10" rx="2" fill="#d1d5db"/><rect x="4" y="34" width="24" height="10" rx="2" fill="#d1d5db"/></svg>' },
  { key: 'persian', label: 'Vertical Pills', diagram: '<svg viewBox="0 0 64 48"><line x1="12" y1="4" x2="12" y2="44" stroke="#9ca3af" stroke-width="2"/><circle cx="12" cy="10" r="4" fill="#d1d5db"/><rect x="20" y="6" width="40" height="8" rx="2" fill="#e5e7eb"/><circle cx="12" cy="26" r="4" fill="#d1d5db"/><rect x="20" y="22" width="40" height="8" rx="2" fill="#e5e7eb"/><circle cx="12" cy="42" r="4" fill="#d1d5db"/><rect x="20" y="38" width="40" height="8" rx="2" fill="#e5e7eb"/></svg>' },
  { key: 'collage', label: 'Horizontal Timeline', diagram: '<svg viewBox="0 0 64 48"><line x1="4" y1="24" x2="60" y2="24" stroke="#9ca3af" stroke-width="2"/><circle cx="12" cy="24" r="4" fill="#d1d5db"/><circle cx="32" cy="24" r="4" fill="#d1d5db"/><circle cx="52" cy="24" r="4" fill="#d1d5db"/><rect x="4" y="6" width="16" height="10" rx="1" fill="#e5e7eb"/><rect x="24" y="6" width="16" height="10" rx="1" fill="#e5e7eb"/><rect x="44" y="6" width="16" height="10" rx="1" fill="#e5e7eb"/></svg>' },
  { key: 'editorial', label: 'Table Rows', diagram: '<svg viewBox="0 0 64 48"><rect x="4" y="4" width="56" height="8" rx="1" fill="#e5e7eb"/><line x1="24" y1="4" x2="24" y2="12" stroke="#d1d5db"/><rect x="4" y="16" width="56" height="8" rx="1" fill="#e5e7eb"/><line x1="24" y1="16" x2="24" y2="24" stroke="#d1d5db"/><rect x="4" y="28" width="56" height="8" rx="1" fill="#e5e7eb"/><line x1="24" y1="28" x2="24" y2="36" stroke="#d1d5db"/><rect x="4" y="40" width="56" height="8" rx="1" fill="#e5e7eb"/><line x1="24" y1="40" x2="24" y2="48" stroke="#d1d5db"/></svg>' },
];

// Story field config per family — controls which fields show in Our Story editor
const STORY_FIELD_CONFIGS = {
  // coastal: photo grid cards → title + description + image
  coastal: { title: { show: true, required: true }, type: { show: false }, description: { show: true, required: false }, date: { show: false }, imageUrl: { show: true, required: true } },
  // parisian: image + paragraphs → only description (as paragraph text)
  parisian: { title: { show: false }, type: { show: false }, description: { show: true, required: true, label: 'editOurStory.paragraph' }, date: { show: false }, imageUrl: { show: false } },
  // persian: story cards (title + text) → title + description, no image
  persian: { title: { show: false }, type: { show: true, required: true }, description: { show: true, required: true }, date: { show: false }, imageUrl: { show: false } },
  // collage: story grid → title + description + image
  collage: { title: { show: true, required: true }, type: { show: false }, description: { show: true, required: false }, date: { show: false }, imageUrl: { show: true, required: false } },
  // chateau: slider cards → title + description + image
  chateau: { title: { show: true, required: true }, type: { show: false }, description: { show: true, required: false }, date: { show: false }, imageUrl: { show: true, required: false } },
  // editorial: chapters → title + date label + description text
  editorial: { title: { show: true, required: true }, type: { show: false }, description: { show: true, required: true }, date: { show: true }, imageUrl: { show: false } },
};
const storyFieldConfig = computed(() =>
  STORY_FIELD_CONFIGS[storyFamily.value] || OUR_STORY_FIELD_CONFIG[preset.id] || STORY_FIELD_CONFIGS.coastal
);

// Unified hero props — each hero component takes only what it declares
const heroProps = computed(() => ({
  brideName: config.brideName,
  groomName: config.groomName,
  weddingDate: config.weddingDate,
  time: config.weddingTime,
  venue: config.venue,
  location: config.location,
  mapUrl: config.heroMapUrl,
  photoUrl: config.heroPhotoUrl,
  labelText: config.heroLabel,
  subtitle: config.heroLabel,
  inviteText: config.heroLabel,
  ctaLabel: config.ctaLabel,
  accentColor: palette.accent,
  accentHover: palette.accent,
  dividerColor: palette.secondary,
  headingFont: fonts.heading,
  bodyFont: fonts.body,
  gradientStart: palette.accent,
  gradientMid: palette.secondary,
  gradientEnd: palette.accent,
  collagePhotos: config.galleryPhotos,
}));

const STORY_FAMILY_OPTIONS = [
  { key: 'coastal', label: 'Photo Grid', diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="18" height="20" rx="2" fill="#d1d5db"/><rect x="23" y="2" width="18" height="20" rx="2" fill="#d1d5db"/><rect x="44" y="2" width="18" height="20" rx="2" fill="#d1d5db"/><rect x="2" y="26" width="60" height="4" rx="1" fill="#e5e7eb"/><rect x="2" y="34" width="60" height="4" rx="1" fill="#e5e7eb"/></svg>' },
  { key: 'parisian', label: 'Image + Story Text', diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="28" height="44" rx="2" fill="#d1d5db"/><rect x="34" y="4" width="26" height="6" rx="1" fill="#9ca3af"/><rect x="34" y="14" width="26" height="16" rx="1" fill="#e5e7eb"/><rect x="34" y="34" width="18" height="6" rx="1" fill="#9ca3af"/></svg>' },
  { key: 'persian', label: 'Photo Grid + Text', diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="28" height="20" rx="2" fill="#d1d5db"/><rect x="34" y="2" width="28" height="20" rx="2" fill="#d1d5db"/><rect x="2" y="26" width="28" height="20" rx="2" fill="#d1d5db"/><rect x="34" y="26" width="28" height="20" rx="2" fill="#d1d5db"/></svg>' },
  { key: 'editorial', label: 'Chapters + Photos', diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="28" height="12" rx="1" fill="#9ca3af"/><rect x="2" y="16" width="28" height="6" rx="1" fill="#e5e7eb"/><rect x="34" y="2" width="28" height="12" rx="1" fill="#9ca3af"/><rect x="34" y="16" width="28" height="6" rx="1" fill="#e5e7eb"/><rect x="2" y="28" width="14" height="18" rx="2" fill="#d1d5db"/><rect x="18" y="28" width="14" height="18" rx="2" fill="#d1d5db"/><rect x="34" y="28" width="14" height="18" rx="2" fill="#d1d5db"/><rect x="50" y="28" width="14" height="18" rx="2" fill="#d1d5db"/></svg>' },
];
</script>

<style scoped>
.unified-invitation {
  container-type: inline-size;
  font-family: var(--font-body);
  background: var(--root-bg, #fff);
  color: var(--theme-text, #374151);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

.section { padding: var(--section-padding, 80px 24px); }
.section-inner { max-width: 1200px; margin: 0 auto; padding: 0 16px; }
.section--base { background: var(--root-bg, #fff); }
.section--alt { background: var(--section-bg, #f9fafb); }
.section--editing { outline: 2px dashed var(--theme-accent, #60a5fa); outline-offset: -2px; }

.section-header { text-align: center; margin-bottom: var(--content-gap, 32px); }
.section-title { font-family: var(--font-heading); font-size: 36px; font-weight: 400; color: var(--theme-text, #1f2937); margin: 0 0 12px; }
.section-divider { width: 64px; height: 1px; background: var(--theme-secondary, #fda4af); margin: 0 auto; }

.details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--content-gap, 24px); margin-bottom: var(--content-gap, 32px); }
.card-svg { width: 100%; height: 100%; }
.map-link { display: flex; align-items: center; gap: 4px; font-family: var(--font-body); font-size: 13px; font-weight: 500; color: var(--theme-accent, #60a5fa); text-decoration: none; transition: opacity 0.2s; }
.map-link:hover { opacity: 0.8; }
.bold { font-weight: 600; }

.countdown-bar { margin-top: var(--content-gap, 32px); padding: 24px; background: var(--card-bg, #fff); border-radius: var(--card-radius, 24px); box-shadow: var(--card-shadow, 0px 4px 20px rgba(0,0,0,0.08)); }

.rsvp-header { text-align: center; margin-bottom: var(--content-gap, 32px); }
.rsvp-subtitle { font-family: var(--font-body); font-size: 15px; color: var(--theme-text, #6b7280); opacity: 0.7; margin-top: 12px; }
.rsvp-wrapper { max-width: 640px; margin: 0 auto; background: var(--card-bg, #fff); padding: var(--card-padding, 32px); border-radius: var(--card-radius, 24px); box-shadow: var(--card-shadow, 0px 4px 20px rgba(0,0,0,0.08)); }

.loading-overlay { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.loading-spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: var(--theme-accent, #60a5fa); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Scroll reveal — disabled in edit mode so sections stay visible */
.unified-invitation:not(.edit-active) [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
.unified-invitation:not(.edit-active) [data-reveal].revealed { opacity: 1; transform: translateY(0); }
.unified-invitation.edit-active [data-reveal] { opacity: 1; transform: none; }

.family-picker-wrap { padding: 0; }
.family-picker-label { font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 8px; }

/* Story image upload (Parisian single image) */
.story-image-upload { padding: 0 0 12px; border-bottom: 1px solid #e5e7eb; margin-bottom: 4px; }
.story-image-label { font-size: 12px; font-weight: 700; color: var(--neutral-500, #6b7280); text-transform: uppercase; letter-spacing: 0.03em; margin: 0 0 8px; }
.story-image-preview-wrap { border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb; }
.story-image-preview { width: 100%; max-height: 160px; object-fit: cover; display: block; }
.story-image-change-btn { display: block; width: 100%; padding: 8px; border: none; background: #f9fafb; font-size: 12px; font-weight: 600; color: var(--brand-main, #1f2937); cursor: pointer; font-family: inherit; }
.story-image-change-btn:hover { background: #f3f4f6; }
.story-image-drop { border: 2px dashed #d1d5db; border-radius: 10px; padding: 24px 16px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; color: #9ca3af; transition: border-color 0.2s, color 0.2s; font-size: 13px; font-weight: 600; }
.story-image-drop:hover { border-color: var(--brand-gold, #c8a24d); color: var(--brand-gold, #c8a24d); }

/* Story images button (Persian gallery) */
.story-images-btn-wrap { padding: 0 0 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 4px; }
.story-images-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; font-family: inherit; transition: all 0.15s; }
.story-images-btn:hover { background: #f9fafb; border-color: #d1d5db; }

/* Story Images panel (separate section) */
.story-images-panel { padding: 12px 16px; }
.story-images-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.story-images-add-btn { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 12px; font-weight: 600; color: #374151; cursor: pointer; font-family: inherit; transition: all 0.15s; }
.story-images-add-btn:hover { background: #f9fafb; border-color: #d1d5db; }
.story-images-add-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.story-images-grid-edit { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; }
.story-img-thumb { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
.story-img-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.story-img-remove { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; border: none; background: rgba(0,0,0,0.55); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
.story-img-thumb:hover .story-img-remove { opacity: 1; }
.story-img-remove:hover { background: rgba(220,38,38,0.85); }
.story-img-progress { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; color: #6b7280; }
.story-img-spinner { width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top-color: var(--brand-gold, #c8a24d); border-radius: 50%; animation: spin 0.6s linear infinite; }
.story-images-empty { font-size: 13px; color: #9ca3af; text-align: center; padding: 16px 0; }
.story-img-thumb--empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: #f9fafb; border: 2px dashed #d1d5db; cursor: pointer; transition: border-color 0.15s, color 0.15s; color: #9ca3af; }
.story-img-thumb--empty:hover { border-color: var(--brand-gold, #c8a24d); color: var(--brand-gold, #c8a24d); }
.placeholder-label { font-size: 10px; font-weight: 600; text-align: center; }
.story-img-badge { position: absolute; bottom: 4px; right: 4px; width: 18px; height: 18px; border-radius: 50%; background: #059669; color: #fff; display: flex; align-items: center; justify-content: center; }
.story-img-thumb { cursor: pointer; }
.story-img-thumb img { pointer-events: none; }
.story-images-info { padding: 8px 0; }
.story-images-info-text { font-size: 13px; color: #6b7280; line-height: 1.5; margin: 0; }

/* Theme palette picker */
.theme-palette-picker { padding: 0; }
.palette-picker-label { font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 12px; }
.palette-grid { display: flex; flex-direction: column; gap: 6px; }
.palette-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.palette-card:hover { border-color: #9ca3af; }
.palette-card--active { border-color: #1f2937; box-shadow: 0 0 0 1px #1f2937; }
.palette-card--dark { border-color: #2a2a2a; }
.palette-card--dark:hover { border-color: #555; }
.palette-card--dark.palette-card--active { border-color: #C8A24D; box-shadow: 0 0 0 1px #C8A24D; }
.palette-card--original { border-style: dashed; }
.palette-accent { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; }
.palette-info { display: flex; flex-direction: column; gap: 1px; }
.palette-name { font-size: 13px; font-weight: 600; line-height: 1.2; }
.palette-tag { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

/* Individual color overrides */
.color-overrides { margin-top: 4px; }
.color-field { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
.color-field-label { font-size: 12px; font-weight: 500; color: #4b5563; }
.color-field-input { display: flex; align-items: center; gap: 6px; }
.color-input { width: 28px; height: 28px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; padding: 0; background: none; }
.color-input::-webkit-color-swatch-wrapper { padding: 2px; }
.color-input::-webkit-color-swatch { border-radius: 4px; border: none; }
.hex-input { width: 72px; padding: 4px 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 11px; font-family: monospace; color: #374151; text-align: center; }

@container (min-width: 1024px) { .section-title { font-size: 48px; } }
</style>

<!-- Unscoped: auto-contrast text colors per background zone -->
<style>
/* ---- Root-level text (on --root-bg) ---- */
.unified-invitation {
  color: var(--theme-text, #1f2937);
}

/* ---- Section-level text (on --section-bg) ---- */
.unified-invitation .section--alt .section-title,
.unified-invitation .section--alt .section-header,
.unified-invitation .section--alt .schedule-title,
.unified-invitation .section--alt .gallery-title,
.unified-invitation .section--alt .story-title,
.unified-invitation .section--alt .timeline-title,
.unified-invitation .section--alt .timeline-heading,
.unified-invitation .section--alt .story-paragraph {
  color: var(--section-text, #1f2937);
}

/* ---- Base section text (on --root-bg) ---- */
.unified-invitation .section--base .section-title,
.unified-invitation .section--base .section-header,
.unified-invitation .section--base .schedule-title,
.unified-invitation .section--base .agenda-title,
.unified-invitation .section--base .timeline-title,
.unified-invitation .section--base .timeline-heading {
  color: var(--theme-text, #1f2937);
}

/* ---- Schedule/Agenda items (on section bg) ---- */
.unified-invitation .section--base .schedule-item .item-title,
.unified-invitation .section--base .schedule-item .time-value,
.unified-invitation .section--base .agenda-item .item-title,
.unified-invitation .section--base .event-title,
.unified-invitation .section--base .time-badge,
.unified-invitation .section--base .time-pill {
  color: var(--theme-text, #1f2937);
}
.unified-invitation .section--base .schedule-item .item-description,
.unified-invitation .section--base .schedule-item .time-period,
.unified-invitation .section--base .agenda-item .item-description,
.unified-invitation .section--base .agenda-item .item-venue,
.unified-invitation .section--base .event-subtitle {
  color: var(--theme-text-muted, #6b7280);
}

.unified-invitation .section--alt .schedule-item .item-title,
.unified-invitation .section--alt .schedule-item .time-value,
.unified-invitation .section--alt .agenda-item .item-title,
.unified-invitation .section--alt .event-title,
.unified-invitation .section--alt .time-badge,
.unified-invitation .section--alt .time-pill {
  color: var(--section-text, #1f2937);
}
.unified-invitation .section--alt .schedule-item .item-description,
.unified-invitation .section--alt .schedule-item .time-period,
.unified-invitation .section--alt .agenda-item .item-description,
.unified-invitation .section--alt .agenda-item .item-venue,
.unified-invitation .section--alt .event-subtitle {
  color: var(--section-text-muted, #6b7280);
}

/* ---- Our Story items ---- */
.unified-invitation .section--alt .story-card .card-title,
.unified-invitation .section--alt .card-heading {
  color: var(--section-text, #1f2937);
}
.unified-invitation .section--alt .story-card .card-description,
.unified-invitation .section--alt .story-card .card-date,
.unified-invitation .section--alt .card-text {
  color: var(--section-text-muted, #6b7280);
}

/* ---- Card-level text (on --card-bg) ---- */
.unified-invitation .detail-card .detail-title {
  color: var(--card-text, #1f2937);
}
.unified-invitation .detail-card .detail-body,
.unified-invitation .detail-card .detail-body p,
.unified-invitation .detail-card .detail-footer {
  color: var(--card-text-muted, #6b7280);
}
.unified-invitation .countdown-bar {
  color: var(--card-text, #1f2937);
}

/* ---- RSVP text ---- */
.unified-invitation .rsvp-header .section-title,
.unified-invitation .rsvp-form .rsvp-title {
  color: var(--theme-text, #1f2937) !important;
}
.unified-invitation .rsvp-subtitle {
  color: var(--theme-text-muted, #6b7280) !important;
}
.unified-invitation .rsvp-form label,
.unified-invitation .rsvp-form .field-label,
.unified-invitation .rsvp-form .guest-name,
.unified-invitation .rsvp-form .section-label {
  color: var(--theme-text, #1f2937) !important;
}
.unified-invitation .rsvp-form input,
.unified-invitation .rsvp-form textarea,
.unified-invitation .rsvp-form select {
  background: var(--item-bg, #f9fafb) !important;
  color: var(--theme-text, #1f2937) !important;
  border-color: var(--theme-text-muted, #d1d5db) !important;
}
.unified-invitation .rsvp-wrapper {
  background: var(--card-bg, #fff);
}

/* ---- Force all text inside schedule/agenda to use theme colors ---- */
.unified-invitation .section--base .schedule-title,
.unified-invitation .section--base .item-title,
.unified-invitation .section--base .time-value,
.unified-invitation .section--base .agenda-title {
  color: var(--theme-text, #1f2937) !important;
}
.unified-invitation .section--base .item-description,
.unified-invitation .section--base .time-period {
  color: var(--theme-text-muted, #6b7280) !important;
}
.unified-invitation .section--alt .schedule-title,
.unified-invitation .section--alt .gallery-title,
.unified-invitation .section--alt .item-title,
.unified-invitation .section--alt .time-value {
  color: var(--section-text, #1f2937) !important;
}
.unified-invitation .section--alt .item-description,
.unified-invitation .section--alt .time-period {
  color: var(--section-text-muted, #6b7280) !important;
}

/* ---- Detail card internal text ---- */
.unified-invitation .detail-card .card-title {
  color: var(--card-text, #1f2937) !important;
}
.unified-invitation .detail-card p,
.unified-invitation .detail-card .map-link {
  color: var(--card-text-muted, #6b7280) !important;
}
.unified-invitation .detail-card .bold {
  color: var(--card-text, #1f2937) !important;
}

/* ---- Countdown text ---- */
.unified-invitation .countdown-bar .countdown-value,
.unified-invitation .countdown-bar .countdown-label,
.unified-invitation .countdown-bar .timer-number,
.unified-invitation .countdown-bar .timer-label {
  color: var(--card-text, #1f2937) !important;
}

/* ---- Hero text ---- */
.unified-invitation .hero-subtitle,
.unified-invitation .hero-date,
.unified-invitation .hero-venue,
.unified-invitation .hero-location,
.unified-invitation .hero-label {
  color: var(--theme-text-muted, #6b7280);
}
.unified-invitation .hero-title,
.unified-invitation .hero-names,
.unified-invitation .hero-couple {
  color: var(--theme-text, #1f2937);
}

/* ---- Time badge/pill backgrounds + text (contrast with badge bg, not section bg) ---- */
.unified-invitation .section--base .time-badge {
  background: var(--badge-bg, #f6f1e3);
  color: var(--badge-text, #1f2937);
}
.unified-invitation .section--alt .time-badge {
  background: var(--badge-bg-alt, #f6f1e3);
  color: var(--badge-text-alt, #1f2937);
}
.unified-invitation .section--base .time-pill {
  background: var(--badge-bg, #f6f1e3) !important;
  color: var(--badge-text, #1f2937);
}
.unified-invitation .section--alt .time-pill {
  background: var(--badge-bg-alt, #f6f1e3) !important;
  color: var(--badge-text-alt, #1f2937);
}
.unified-invitation .section--base .timeline-dot {
  background: var(--badge-bg, #E6E6FA) !important;
}
.unified-invitation .section--alt .timeline-dot {
  background: var(--badge-bg-alt, #E6E6FA) !important;
}

/* ---- Our Story / Agenda card backgrounds (same hue, slightly lighter) ---- */
.unified-invitation .section--alt .story-card {
  background: var(--item-bg-alt, #fff) !important;
}
.unified-invitation .section--base .story-card {
  background: var(--item-bg, #fff) !important;
}
.unified-invitation .section--alt .event-card {
  background: var(--item-bg-alt, #fff) !important;
}
.unified-invitation .section--base .event-card {
  background: var(--item-bg, #fff) !important;
}
</style>
