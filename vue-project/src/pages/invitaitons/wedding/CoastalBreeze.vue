<template>
  <InvitationEditLayout
    :edit-mode="isEditMode"
    :sections="orderedSections"
    :active-section="activeRootSection"
    :dirty="dirty"
    :preview-mode="previewMode"
    :statuses="sectionStatuses"
    :section-visibility="sectionVisibility"
    @toggle-section="toggleSection"
    @toggle-visibility="(k) => { toggleVisibility(k); markDirty(); }"
    @save="onGlobalSave"
    @set-preview="previewMode = $event"
    @select-section="selectSection"
  >
  <div ref="rootRef" class="coastal-breeze" :style="rootStyle">
    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <div v-show="!loading">

    <!-- ENTRY OVERLAY -->
    <InvitationEntry
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
    <div v-show="!showEntry" data-edit-section="hero" :class="{ 'section--editing': isEditMode && activeRootSection === 'hero' }" style="position:relative;">
    <HeroSection
      :bride-name="config.brideName"
      :groom-name="config.groomName"
      :wedding-date="config.weddingDate"
      :time="config.weddingTime"
      :venue="config.venue"
      :location="config.location"
      :map-url="config.heroMapUrl"
      :photo-url="config.heroPhotoUrl"
      :label-text="config.heroLabel"
      :cta-label="config.ctaLabel"
      :accent-color="palette.accent"
      :accent-hover="palette.accent"
      :divider-color="palette.secondary"
      :heading-font="fonts.heading"
      :body-font="fonts.body"
    />
    </div>

    <!-- Event Details -->
    <section v-show="!showEntry" v-if="isSectionVisible('details')" data-edit-section="details" :class="['section section--gray', { 'section--editing': isEditMode && activeRootSection === 'details' }]" data-reveal style="position:relative;">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">{{ t('invitation.eventDetails') }}</h2>
          <div class="section-divider"></div>
        </div>

        <div class="details-grid">
          <!-- Ceremony -->
          <DetailCard
            :title="config.ceremonyVenue || t('invitation.ceremony')"
            :bg-color="cardStyle.cardBg"
            :border-width="cardStyle.cardBorder"
            :border-radius="cardStyle.cardRadius"
            :shadow="shadows.card"
            :hover-shadow="shadows.cardHover"
            :icon-bg="palette.accent"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
          >
            <template #icon>
              <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </template>
            <p v-if="config.ceremonyDate" class="bold">{{ config.ceremonyDate }}</p>
            <p v-if="config.ceremonyTime">{{ config.ceremonyTime }}</p>
            <template #footer>
              <a v-if="config.ceremonyMapUrl" :href="config.ceremonyMapUrl" target="_blank" rel="noopener" class="map-link">{{ t('invitation.viewMap') }}</a>
            </template>
          </DetailCard>

          <!-- Reception -->
          <DetailCard
            :title="config.receptionVenue || t('invitation.reception')"
            :bg-color="cardStyle.cardBg"
            :border-width="cardStyle.cardBorder"
            :border-radius="cardStyle.cardRadius"
            :shadow="shadows.card"
            :hover-shadow="shadows.cardHover"
            :icon-bg="palette.secondary"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
          >
            <template #icon>
              <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </template>
            <p v-if="config.receptionDate" class="bold">{{ config.receptionDate }}</p>
            <p v-if="config.receptionTime">{{ config.receptionTime }}</p>
            <template #footer>
              <a v-if="config.receptionMapUrl" :href="config.receptionMapUrl" target="_blank" rel="noopener" class="map-link">{{ t('invitation.viewMap') }}</a>
            </template>
          </DetailCard>

          <!-- Location -->
          <DetailCard
            :title="t('invitation.location')"
            :bg-color="cardStyle.cardBg"
            :border-width="cardStyle.cardBorder"
            :border-radius="cardStyle.cardRadius"
            :shadow="shadows.card"
            :hover-shadow="shadows.cardHover"
            :icon-bg="palette.accent"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
          >
            <template #icon>
              <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </template>
            <p>{{ config.venue }}</p>
            <template #footer>
              <a v-if="config.locationMapUrl" :href="config.locationMapUrl" target="_blank" rel="noopener" class="map-link">{{ t('invitation.viewMap') }}</a>
            </template>
          </DetailCard>
        </div>

        <!-- Countdown -->
        <div class="countdown-bar">
          <CountdownTimer
            :target-date="config.weddingDateTime"
            label="Counting down to our special day"
            :show-seconds="false"
            :colors="[palette.text, palette.text, palette.text]"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            label-color="#4b5563"
            unit-label-color="#6b7280"
          />
        </div>
      </div>
    </section>

    <!-- Schedule -->
    <section v-if="(isEditMode || (showAgenda && !isPrivate)) && isSectionVisible('agendaList')" v-show="!showEntry" data-edit-section="agendaList" :class="['section section--white', { 'section--editing': isEditMode && activeRootSection === 'agendaList' }]" data-reveal style="position:relative;">
      <div class="section-inner">
        <ScheduleList
          :title="t('invitation.schedule')"
          :events="config.scheduleEvents"
          :divider-color="palette.secondary"
          :heading-font="fonts.heading"
          :body-font="fonts.body"
        />
      </div>
    </section>

    <!-- Our Story -->
    <section v-if="(isEditMode || showOurStory) && isSectionVisible('ourStoryList')" v-show="!showEntry" data-edit-section="ourStoryList" :class="['section section--gray', { 'section--editing': isEditMode && activeRootSection === 'ourStoryList' }]" data-reveal style="position:relative;">
      <div class="section-inner">
        <StoryGallery
          :title="t('invitation.ourStory')"
          :stories="config.stories"
          :divider-color="palette.secondary"
          :heading-font="fonts.heading"
          :body-font="fonts.body"
        />
      </div>
    </section>

    <!-- RSVP -->
    <section v-show="!showEntry" v-if="isSectionVisible('rsvp')" id="rsvp-section" data-edit-section="rsvp" :class="['section section--white', { 'section--editing': isEditMode && activeRootSection === 'rsvp' }]" data-reveal>
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
      <SectionLayoutPicker v-if="subTab === 'layout'" :layouts="SECTION_LAYOUTS.hero || []" :current="sectionLayouts.hero" @select="setLayout('hero', $event); markDirty()" />
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
          :max-items="3"
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
      <SectionLayoutPicker v-if="subTab === 'layout'" :layouts="SECTION_LAYOUTS.agendaList || []" :current="sectionLayouts.agendaList" @select="setLayout('agendaList', $event); markDirty()" />
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="agendaList" :visible="isSectionVisible('agendaList')" :anchor-id="sectionAdvancedState.agendaList?.anchorId || ''" :animation="sectionAdvancedState.agendaList?.animation || 'none'" :overrides="sectionOverrides.agendaList || null" @update="onAdvancedUpdate('agendaList', $event)" />
    </template>

    <!-- Our Story -->
    <template v-if="isEditMode" #section-ourStoryList="{ subTab }">
      <template v-if="subTab === 'content'">
        <EditOurStoryModal
          v-if="!editingItem && activeModal === 'ourStoryList'"
          :open="true"
          :items="ourStory.items.value"
          :max-items="3"
          :field-config="OUR_STORY_FIELD_CONFIG['coastal-breeze']"
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
        <OurStoryUploadModal
          v-if="activeModal === 'ourStoryImages'"
          :open="true"
          sub-modal
          :images="ourStory.images.value"
          @close="closeModal"
          @uploaded="refreshAllData"
          @files-collected="onOurStoryFiles"
        />
      </template>
      <SectionLayoutPicker v-if="subTab === 'layout'" :layouts="SECTION_LAYOUTS.ourStoryList || []" :current="sectionLayouts.ourStoryList" @select="setLayout('ourStoryList', $event); markDirty()" />
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="ourStoryList" :visible="isSectionVisible('ourStoryList')" :anchor-id="sectionAdvancedState.ourStoryList?.anchorId || ''" :animation="sectionAdvancedState.ourStoryList?.animation || 'none'" :overrides="sectionOverrides.ourStoryList || null" @update="onAdvancedUpdate('ourStoryList', $event)" />
    </template>

    <!-- Collage (shown when gallery entry selected) -->
    <template v-if="isEditMode" #section-collage="{ subTab }">
      <template v-if="subTab === 'content'">
        <EditCollageModal
          :open="true"
          @close="toggleSection('collage')"
          @updated="refreshAllData"
          @files-collected="onCollageFiles"
        />
      </template>
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
      <EditColorsModal
        :open="true"
        :live-edit="true"
        :fields="colorFields"
        :presets="PALETTE_PRESETS"
        @close="toggleSection('colors')"
        @change="onColorsChange"
      />
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

    <template v-if="isEditMode" #section-buttons>
      <EditButtonsModal
        :open="true"
        :live-edit="true"
        :current-bg="buttonStyle.bg"
        :current-text="buttonStyle.text"
        :current-radius="buttonStyle.radius"
        @close="toggleSection('buttons')"
        @change="onButtonsChange"
      />
    </template>

    <template v-if="isEditMode" #section-background>
      <EditBackgroundModal
        :open="true"
        :live-edit="true"
        :current-section-bg="cardStyle.sectionBg"
        :current-card-bg="cardStyle.cardBg"
        :current-card-shadow="cardStyle.cardShadow"
        :current-card-radius="cardStyle.cardRadius"
        :current-card-border="cardStyle.cardBorder"
        @close="toggleSection('background')"
        @change="onBackgroundChange"
      />
    </template>

    <template v-if="isEditMode" #section-spacing>
      <EditSpacingModal
        :open="true"
        :live-edit="true"
        :current-preset="spacingPreset"
        @close="toggleSection('spacing')"
        @change="onSpacingChange"
      />
    </template>
  </InvitationEditLayout>
</template>

<script setup>
import { reactive, ref, onMounted, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { rsvpService } from '@/services/rsvp.service';
import { mediaService } from '@/services/media.service';
import { useInvitationData } from '@/composables/useInvitationData';
import { useScrollReveal } from '@/composables/useScrollReveal';
import { buildLocationAddress, buildMapUrl, formatTimeRange } from '@/utils/invitation';
import { getFutureWeddingDate, formatWeddingDateFull, toLocalISO } from '@/utils/date.js';
import HeroSection from '@/components/invitations/wedding/CoastalBreeze/HeroSection.vue';
import ScheduleList from '@/components/invitations/wedding/CoastalBreeze/ScheduleList.vue';
import StoryGallery from '@/components/invitations/wedding/CoastalBreeze/StoryGallery.vue';
import DetailCard from '@/components/invitations/shared/DetailCard.vue';
import CountdownTimer from '@/components/invitations/shared/CountdownTimer.vue';
import RsvpForm from '@/components/invitations/shared/RsvpForm.vue';
import InvitationEntry from '@/components/invitations/entries/InvitationEntry.vue';
import EditEntryModal from '@/components/modals/EditEntryModal.vue';
import EditColorsModal from '@/components/modals/EditColorsModal.vue';
import EditFontsModal from '@/components/modals/EditFontsModal.vue';
import { useInvitationEditMode } from '@/composables/useInvitationEditMode';
import { useSectionState } from '@/composables/useSectionState';
import { getDraftTheme, setDraftTheme, getDraftSectionState, setDraftSectionState, setDraftFullPayload } from '@/store/invitationDraft.store';
import SectionLayoutPicker from '@/components/invitations/shared/SectionLayoutPicker.vue';
import SectionAdvanced from '@/components/invitations/shared/SectionAdvanced.vue';
import { isAuthenticated } from '@/services/auth.service';
import AddAgendaItemModal from '@/components/modals/AddAgendaItemModal.vue';
import AddOurStoryModal from '@/components/modals/AddOurStoryModal.vue';
import EditHeroModal from '@/components/modals/EditHeroModal.vue';
import EditDetailsModal from '@/components/modals/EditDetailsModal.vue';
import AddEventDetailModal from '@/components/modals/AddEventDetailModal.vue';
import EditAgendaModal from '@/components/modals/EditAgendaModal.vue';
import OurStoryUploadModal from '@/components/modals/OurStoryUploadModal.vue';
import EditCollageModal from '@/components/modals/EditCollageModal.vue';
import EditOurStoryModal from '@/components/modals/EditOurStoryModal.vue';
import { OUR_STORY_FIELD_CONFIG } from '@/config/ourStoryFieldConfig.js';
import EditRsvpModal from '@/components/modals/EditRsvpModal.vue';
import EditButtonsModal from '@/components/modals/EditButtonsModal.vue';
import EditBackgroundModal from '@/components/modals/EditBackgroundModal.vue';
import EditSpacingModal from '@/components/modals/EditSpacingModal.vue';
import InvitationEditLayout from '@/components/invitations/shared/InvitationEditLayout.vue';
import EditInfoPanel from '@/components/invitations/shared/EditInfoPanel.vue';
import { EventDetailTypeSortOrder } from '@/enums/EventDetailType';
import { buildEventFullPayload } from '@/utils/buildEventFullPayload';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const { eventId, loading, localized, formatDate, formatTime, fetchData } = useInvitationData();

const {
  isEditMode, activeModal, activeRootSection, editingItem,
  openModal, closeModal, closeAllModals, selectSection, refreshCallback, agenda, eventDetails, ourStory,
  handleAgendaSave, handleAgendaUpdate, handleAgendaDelete,
  handleEventDetailSave, handleEventDetailUpdate, handleEventDetailDelete,
  handleOurStorySave, handleOurStoryUpdate, handleOurStoryDelete,
  loadEditData, fetchInvitationConfig,
  dirty, previewMode, markDirty, clearDirty, toggleSection, setupUnsavedGuard,
  saveFullEvent, saving,
} = useInvitationEditMode();

const rootRef = ref(null);
const entryRef = ref(null);
const showEntry = ref(true);
const showAgenda = ref(true);
const showOurStory = ref(true);
const entryType = ref('envelop');
const entryDesign = ref('classic');

// Auto-open entry section when entry overlay is visible in edit mode
watch(showEntry, (visible) => {
  if (!isEditMode.value) return;
  if (visible) {
    toggleSection('entry');
  } else if (activeRootSection.value === 'entry') {
    toggleSection('entry');
  }
}, { immediate: true });

const SIDEBAR_SECTIONS = [
  // Tab 1: Sections
  { key: 'entry', label: t('editSection.entry'), tab: 'sections', mandatory: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>' },
  { key: 'hero', label: t('editSection.hero'), tab: 'sections', mandatory: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
  { key: 'details', label: t('editSection.details'), tab: 'sections', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
  { key: 'agendaList', label: t('editSection.agenda'), tab: 'sections', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' },
  { key: 'ourStoryList', label: t('editSection.ourStory'), tab: 'sections', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { key: 'collage', label: t('editSection.collage'), tab: 'sections', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
  { key: 'rsvp', label: t('editSection.rsvp'), tab: 'sections', mandatory: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' },
  // Tab 2: Style
  { key: 'colors', label: t('editSection.colors'), tab: 'style', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="13" r="2.5"/><circle cx="14.5" cy="19.5" r="2.5"/><circle cx="6" cy="17" r="2.5"/><circle cx="4.5" cy="9.5" r="2.5"/></svg>' },
  { key: 'fonts', label: t('editSection.fonts'), tab: 'style', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>' },
  { key: 'buttons', label: t('editSection.buttons'), tab: 'style', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="8" rx="4"/><line x1="8" y1="12" x2="16" y2="12"/></svg>' },
  { key: 'background', label: t('editSection.background'), tab: 'style', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>' },
  { key: 'spacing', label: t('editSection.spacing'), tab: 'style', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="3" x2="3" y2="3"/><line x1="21" y1="21" x2="3" y2="21"/><line x1="12" y1="8" x2="12" y2="16"/><polyline points="8 12 12 8 16 12"/><polyline points="8 12 12 16 16 12"/></svg>' },
];

// Section state (order, visibility, layouts, overrides)
const {
  sectionOrder, sectionVisibility, sectionLayouts, sectionOverrides,
  orderedSections, isSectionVisible, toggleVisibility,
  reorder, setLayout, setOverride, clearOverride, getSectionStatus,
  getState: getSectionState, loadState: loadSectionState,
} = useSectionState(SIDEBAR_SECTIONS);

// Section advanced state (anchorId, animation per section)
const sectionAdvancedState = reactive({});

// Computed section statuses for outline
const sectionStatuses = computed(() => {
  const result = {};
  SIDEBAR_SECTIONS.filter(s => s.tab === 'sections').forEach(s => {
    result[s.key] = getSectionStatus(s.key, config);
  });
  return result;
});

// Layout definitions per section (SVG diagram thumbnails)
const SECTION_LAYOUTS = {
  hero: [
    { key: 'centered', label: t('editSection.layoutCentered'), diagram: '<svg viewBox="0 0 64 48"><rect x="16" y="4" width="32" height="6" rx="1" fill="#9ca3af"/><rect x="8" y="14" width="48" height="14" rx="1" fill="#d1d5db"/><rect x="20" y="34" width="24" height="6" rx="1" fill="#9ca3af"/></svg>' },
    { key: 'left', label: t('editSection.layoutLeftAligned'), diagram: '<svg viewBox="0 0 64 48"><rect x="4" y="4" width="28" height="6" rx="1" fill="#9ca3af"/><rect x="4" y="14" width="36" height="14" rx="1" fill="#d1d5db"/><rect x="4" y="34" width="20" height="6" rx="1" fill="#9ca3af"/></svg>' },
    { key: 'split', label: t('editSection.layoutSplit'), diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="28" height="44" rx="2" fill="#d1d5db"/><rect x="34" y="8" width="26" height="6" rx="1" fill="#9ca3af"/><rect x="34" y="18" width="26" height="10" rx="1" fill="#e5e7eb"/><rect x="34" y="34" width="18" height="6" rx="1" fill="#9ca3af"/></svg>' },
  ],
  details: [
    { key: 'cards', label: t('editSection.layoutCards'), diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="4" width="18" height="18" rx="2" fill="#d1d5db"/><rect x="23" y="4" width="18" height="18" rx="2" fill="#d1d5db"/><rect x="44" y="4" width="18" height="18" rx="2" fill="#d1d5db"/><rect x="12" y="28" width="40" height="6" rx="1" fill="#e5e7eb"/></svg>' },
    { key: 'list', label: t('editSection.layoutList'), diagram: '<svg viewBox="0 0 64 48"><rect x="4" y="4" width="56" height="10" rx="2" fill="#d1d5db"/><rect x="4" y="18" width="56" height="10" rx="2" fill="#d1d5db"/><rect x="4" y="32" width="56" height="10" rx="2" fill="#d1d5db"/></svg>' },
  ],
  agendaList: [
    { key: 'timeline', label: t('editSection.layoutTimeline'), diagram: '<svg viewBox="0 0 64 48"><line x1="32" y1="4" x2="32" y2="44" stroke="#9ca3af" stroke-width="2"/><circle cx="32" cy="10" r="3" fill="#d1d5db"/><circle cx="32" cy="24" r="3" fill="#d1d5db"/><circle cx="32" cy="38" r="3" fill="#d1d5db"/><rect x="38" y="7" width="22" height="6" rx="1" fill="#e5e7eb"/><rect x="4" y="21" width="22" height="6" rx="1" fill="#e5e7eb"/><rect x="38" y="35" width="22" height="6" rx="1" fill="#e5e7eb"/></svg>' },
    { key: 'cards', label: t('editSection.layoutCards'), diagram: '<svg viewBox="0 0 64 48"><rect x="4" y="2" width="56" height="12" rx="2" fill="#d1d5db"/><rect x="4" y="18" width="56" height="12" rx="2" fill="#d1d5db"/><rect x="4" y="34" width="56" height="12" rx="2" fill="#d1d5db"/></svg>' },
  ],
  ourStoryList: [
    { key: 'gallery', label: t('editSection.layoutGrid'), diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="28" height="20" rx="2" fill="#d1d5db"/><rect x="34" y="2" width="28" height="20" rx="2" fill="#d1d5db"/><rect x="2" y="26" width="28" height="20" rx="2" fill="#d1d5db"/><rect x="34" y="26" width="28" height="20" rx="2" fill="#d1d5db"/></svg>' },
    { key: 'timeline', label: t('editSection.layoutTimeline'), diagram: '<svg viewBox="0 0 64 48"><line x1="32" y1="4" x2="32" y2="44" stroke="#9ca3af" stroke-width="2"/><rect x="4" y="6" width="24" height="14" rx="2" fill="#d1d5db"/><rect x="36" y="28" width="24" height="14" rx="2" fill="#d1d5db"/></svg>' },
  ],
  rsvp: [
    { key: 'card', label: t('editSection.layoutCards'), diagram: '<svg viewBox="0 0 64 48"><rect x="8" y="4" width="48" height="40" rx="4" fill="#d1d5db"/><rect x="14" y="12" width="36" height="6" rx="1" fill="#9ca3af"/><rect x="14" y="22" width="36" height="6" rx="1" fill="#9ca3af"/><rect x="20" y="34" width="24" height="6" rx="2" fill="#6b7280"/></svg>' },
    { key: 'compact', label: t('editSection.layoutCompact'), diagram: '<svg viewBox="0 0 64 48"><rect x="4" y="10" width="56" height="28" rx="2" fill="#d1d5db"/><rect x="8" y="16" width="24" height="5" rx="1" fill="#9ca3af"/><rect x="8" y="24" width="24" height="5" rx="1" fill="#9ca3af"/><rect x="36" y="16" width="20" height="14" rx="2" fill="#6b7280"/></svg>' },
  ],
};

// Advanced update handler
function onAdvancedUpdate(key, data) {
  if (data.visible !== undefined) {
    if (data.visible) {
      if (sectionVisibility.value[key] === false) toggleVisibility(key);
    } else {
      if (sectionVisibility.value[key] !== false) toggleVisibility(key);
    }
  }
  sectionAdvancedState[key] = { anchorId: data.anchorId, animation: data.animation };
  if (data.overrides) {
    setOverride(key, data.overrides);
  } else {
    clearOverride(key);
  }
  markDirty();
}

// Live edit handlers
function onEntryChange({ type, design }) {
  entryType.value = type;
  entryDesign.value = design;
  markDirty();
}

const heroEventData = computed(() => ({
  heroImageUrl: config.heroPhotoUrl || '',
}));

const heroFile = ref(null);
const ourStoryFiles = ref([]);
const collageFiles = ref([]);
function onOurStoryFiles(files) { ourStoryFiles.value.push(...files); markDirty(); }
function onCollageFiles(files) { collageFiles.value.push(...files); markDirty(); }

// Show collage section only when gallery entry is selected
watch(entryType, (type) => {
  sectionVisibility.value = { ...sectionVisibility.value, collage: type === 'gallery' };
}, { immediate: true });
function onHeroChange(data) {
  if (data.heroImageUrl) config.heroPhotoUrl = data.heroImageUrl;
  if (data.heroFile !== undefined) heroFile.value = data.heroFile;
  markDirty();
}

function onInfoChange(data) {
  if (data.brideName !== undefined) config.brideName = data.brideName;
  if (data.groomName !== undefined) config.groomName = data.groomName;
  if (data.date) {
    config.weddingDateTime = data.date;
    config.weddingDate = formatDate(data.date);
    config.weddingTime = formatTime(data.date);
  }
  if (data.location) {
    const loc = data.location;
    if (loc.name) config.venue = loc.name;
    if (loc.address) config.location = loc.address;
    config.locationLat = loc.lat || null;
    config.locationLng = loc.lng || null;
    const mapUrl = buildMapUrl({ latitude: loc.lat, longitude: loc.lng });
    if (mapUrl) {
      config.locationMapUrl = mapUrl;
      config.heroMapUrl = mapUrl;
    }
  }
  markDirty();
}

function onColorsChange(colors) {
  Object.assign(palette, colors);
  markDirty();
}

function onFontsChange({ heading, body }) {
  const headingCss = `'${heading}', ${/Script|Vibes|Brush|Parisienne/.test(heading) ? 'cursive' : 'serif'}`;
  fonts.heading = headingCss;
  fonts.body = `'${body}', sans-serif`;
  loadGoogleFont(heading);
  loadGoogleFont(body);
  markDirty();
}

function onRsvpChange(cfg) {
  Object.assign(rsvpConfig, cfg);
  markDirty();
}

function onButtonsChange({ bg, text, radius }) {
  Object.assign(buttonStyle, { bg, text, radius });
  markDirty();
}

function onBackgroundChange(style) {
  Object.assign(cardStyle, style);
  markDirty();
}

function onSpacingChange(preset) {
  spacingPreset.value = preset;
  markDirty();
}

async function onGlobalSave() {
  if (isAuthenticated()) {
    const payload = buildEventFullPayload({
      config,
      palette,
      fonts,
      buttonStyle,
      cardStyle,
      spacingPreset: spacingPreset.value,
      rsvpConfig,
      entryType: entryType.value,
      entryDesign: entryDesign.value,
      sectionOrder: sectionOrder.value,
      sectionVisibility: sectionVisibility.value,
      sectionLayouts: { ...sectionLayouts },
      eventDetailItems: eventDetails.items.value,
      agendaItems: agenda.items.value,
      ourStoryItems: ourStory.items.value,
      invitationName: 'coastal-breeze',
      lang: locale.value,
    });
    await saveFullEvent(payload, { heroImage: heroFile.value, ourStoryImages: ourStoryFiles.value.length ? ourStoryFiles.value : undefined, collageImages: collageFiles.value.length ? collageFiles.value : undefined });
    if (eventId) { router.push({ name: 'dashboard.overview', params: { lang: locale.value } }); return; }
  } else {
    const payload = buildEventFullPayload({
      config,
      palette,
      fonts,
      buttonStyle,
      cardStyle,
      spacingPreset: spacingPreset.value,
      rsvpConfig,
      entryType: entryType.value,
      entryDesign: entryDesign.value,
      sectionOrder: sectionOrder.value,
      sectionVisibility: sectionVisibility.value,
      sectionLayouts: { ...sectionLayouts },
      eventDetailItems: eventDetails.items.value,
      agendaItems: agenda.items.value,
      ourStoryItems: ourStory.items.value,
      invitationName: 'coastal-breeze',
      lang: locale.value,
    });
    saveThemeToDraft();
    setDraftFullPayload(payload);
    clearDirty();
    router.push({ name: 'signup', params: { lang: locale.value } });
    return;
  }
  clearDirty();
}
const isPrivate = computed(() => route.query.isPrivate === 'true');
useScrollReveal(rootRef);

const DEFAULT_PALETTE = {
  accent: '#bfdbfe',
  secondary: '#fda4af',
  text: '#1f2937',
};

const DEFAULT_FONTS = {
  heading: "'Cormorant Garamond', serif",
  body: "'Montserrat', sans-serif",
};

const palette = reactive({ ...DEFAULT_PALETTE });
const fonts = reactive({ ...DEFAULT_FONTS });

const COLOR_FIELDS = [
  { key: 'accent', label: t('editSection.accentColor') },
  { key: 'secondary', label: t('editSection.secondaryColor') },
  { key: 'text', label: t('editSection.textColor') },
];

const PALETTE_PRESETS = [
  { name: 'Ocean', colors: { accent: '#bfdbfe', secondary: '#fda4af', text: '#1f2937' } },
  { name: 'Sage', colors: { accent: '#a7f3d0', secondary: '#fecaca', text: '#1c3a2e' } },
  { name: 'Lavender', colors: { accent: '#ddd6fe', secondary: '#fed7aa', text: '#2e1065' } },
  { name: 'Golden', colors: { accent: '#fde68a', secondary: '#fecdd3', text: '#451a03' } },
  { name: 'Mauve', colors: { accent: '#fbcfe8', secondary: '#c7d2fe', text: '#3b0764' } },
];

const colorFields = computed(() =>
  COLOR_FIELDS.map(f => ({ ...f, value: palette[f.key] }))
);

const rootStyle = computed(() => ({
  '--font-heading': fonts.heading,
  '--font-body': fonts.body,
  '--theme-accent': palette.accent,
  '--theme-secondary': palette.secondary,
  '--theme-text': palette.text,
  '--btn-bg': buttonStyle.bg,
  '--btn-text': buttonStyle.text,
  '--btn-radius': buttonStyle.radius,
  '--section-bg': cardStyle.sectionBg,
  '--card-bg': cardStyle.cardBg,
  '--card-shadow': SHADOW_MAP[cardStyle.cardShadow],
  '--card-radius': cardStyle.cardRadius,
  '--card-border-width': cardStyle.cardBorder,
  '--section-padding': SPACING_MAP[spacingPreset.value].section,
  '--content-gap': SPACING_MAP[spacingPreset.value].gap,
  '--card-padding': SPACING_MAP[spacingPreset.value].cardPadding,
}));

function extractFontName(cssFontFamily) {
  return cssFontFamily.replace(/^'|'.*$/g, '');
}

function loadGoogleFont(name) {
  const url = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
  if (!document.querySelector(`link[href="${url}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }
}


function saveThemeToDraft() {
  if (!isAuthenticated()) {
    setDraftTheme({
      palette: { ...palette },
      fonts: { ...fonts },
      buttonStyle: { ...buttonStyle },
      cardStyle: { ...cardStyle },
      spacingPreset: spacingPreset.value,
      rsvpConfig: { ...rsvpConfig },
    });
    setDraftSectionState({
      ...getSectionState(),
      advanced: { ...sectionAdvancedState },
    });
  }
}

function loadThemeFromDraft(invConfig) {
  let theme, rsvpData, entry, sectionState;

  if (invConfig) {
    // Authenticated: from BE event DTO
    theme = invConfig.theme;
    rsvpData = invConfig.rsvpConfig;
    entry = invConfig.entry;
    if (invConfig.sectionOrder) {
      const order = Object.entries(invConfig.sectionOrder).sort(([,a],[,b]) => a - b).map(([k]) => k);
      sectionState = { order, visibility: invConfig.sectionVisibility || {}, layouts: invConfig.sectionLayouts || {} };
    }
  } else if (!isAuthenticated()) {
    // Guest: from localStorage draft
    theme = getDraftTheme();
    sectionState = getDraftSectionState();
  }

  if (theme) {
    if (theme.palette) Object.assign(palette, theme.palette);
    if (theme.fonts) {
      Object.assign(fonts, theme.fonts);
      loadGoogleFont(extractFontName(fonts.heading));
      loadGoogleFont(extractFontName(fonts.body));
    }
    if (theme.buttonStyle) Object.assign(buttonStyle, theme.buttonStyle);
    if (theme.cardStyle) Object.assign(cardStyle, theme.cardStyle);
    if (theme.spacingPreset) spacingPreset.value = theme.spacingPreset;
  }
  if (rsvpData || theme?.rsvpConfig) Object.assign(rsvpConfig, rsvpData || theme.rsvpConfig);
  if (entry) {
    entryType.value = entry.type || entryType.value;
    entryDesign.value = entry.design || entryDesign.value;
  }
  if (sectionState) {
    loadSectionState(sectionState);
    if (sectionState.advanced) Object.assign(sectionAdvancedState, sectionState.advanced);
  }
}

const SHADOW_MAP = {
  none: 'none',
  subtle: '0px 4px 20px rgba(0,0,0,0.08)',
  medium: '0px 6px 24px rgba(0,0,0,0.12)',
  strong: '0px 10px 40px rgba(0,0,0,0.18)',
};

const SPACING_MAP = {
  compact: { section: '48px 16px', gap: '24px', cardPadding: '20px' },
  balanced: { section: '80px 24px', gap: '32px', cardPadding: '32px' },
  spacious: { section: '120px 32px', gap: '48px', cardPadding: '40px' },
};

const buttonStyle = reactive({ bg: '#1f2937', text: '#ffffff', radius: '8px' });
const cardStyle = reactive({
  sectionBg: '#f9fafb', cardBg: '#ffffff',
  cardShadow: 'subtle', cardRadius: '24px', cardBorder: '0px',
});
const spacingPreset = ref('balanced');
const rsvpConfig = reactive({
  deadline: '', maxGuests: 5, showDietary: true, borderRadius: '8px',
});

const shadows = computed(() => ({
  card: SHADOW_MAP[cardStyle.cardShadow],
  cardHover: cardStyle.cardShadow === 'none' ? 'none' : SHADOW_MAP.medium,
}));

const _futureDate = getFutureWeddingDate();

const config = reactive({
  brideName: 'Emma',
  groomName: 'Lucas',
  weddingDate: formatWeddingDateFull(_futureDate),
  weddingDateTime: toLocalISO(_futureDate, '16:00:00'),
  weddingTime: '4:00 PM',
  venue: 'Seaside Garden Estate',
  location: 'Malibu, California',
  heroPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1200&fit=crop',
  heroLabel: "You're Invited",
  ctaLabel: 'RSVP',
  galleryPhotos: [],

  ceremonyDate: '',
  ceremonyTime: '4:00 PM - 5:00 PM',
  ceremonyVenue: 'Garden Terrace',
  ceremonyMapUrl: '',
  receptionDate: '',
  receptionTime: '6:00 PM - 11:00 PM',
  receptionVenue: 'Grand Ballroom',
  receptionMapUrl: '',
  heroMapUrl: '',
  locationMapUrl: '',

  scheduleTitle: 'Schedule',
  scheduleEvents: [
    { timeValue: '4:00', timePeriod: 'PM', title: 'Ceremony Begins', description: 'Garden Terrace overlooking the ocean' },
    { timeValue: '5:00', timePeriod: 'PM', title: 'Cocktail Hour', description: 'Champagne and canap\u00e9s on the terrace' },
    { timeValue: '6:00', timePeriod: 'PM', title: 'Reception & Dinner', description: 'Three-course meal in the Grand Ballroom' },
    { timeValue: '8:00', timePeriod: 'PM', title: 'First Dance & Celebration', description: 'Dancing under the stars' },
    { timeValue: '11:00', timePeriod: 'PM', title: 'Grand Finale', description: 'Sparkler send-off' },
  ],

  storyTitle: 'Our Story',
  stories: [
    {
      imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=400&fit=crop',
      date: 'Spring 2018',
      title: 'First Meeting',
      description: 'A chance encounter at a coffee shop that changed everything',
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&h=400&fit=crop',
      date: 'Summer 2018',
      title: 'First Date',
      description: 'A sunset picnic by the beach where we talked for hours',
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=400&fit=crop',
      date: 'Winter 2024',
      title: 'The Proposal',
      description: 'Under the northern lights in Iceland, he asked the question',
    },
  ],

  rsvpMessage: '',
});

function parseTimeToMinutes(str) {
  if (!str) return 0;
  const m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const p = m[3]?.toUpperCase();
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function applyBackendData(data) {
  const ev = data.event;
  if (!ev) return;

  showAgenda.value = ev.showAgenda ?? true;
  showOurStory.value = ev.showOurStory ?? true;

  if (ev.coupleNames?.bride) config.brideName = ev.coupleNames.bride;
  if (ev.coupleNames?.groom) config.groomName = ev.coupleNames.groom;
  if (ev.heroImageUrl) config.heroPhotoUrl = ev.heroImageUrl;

  if (ev.date) {
    config.weddingDateTime = ev.date;
    config.weddingDate = formatDate(ev.date);
    config.weddingTime = formatTime(ev.date);
  }

  const subtitle = localized(ev.messageI18n, ev.message);
  if (subtitle) config.heroLabel = subtitle;

  if (data.location) {
    const loc = data.location;
    if (loc.venueName) config.venue = loc.venueName;
    const addressStr = [loc.city, loc.country].filter(Boolean).join(', ') || loc.address || '';
    if (addressStr) config.location = addressStr;
    const mapUrl = buildMapUrl(loc);
    if (mapUrl) {
      config.locationMapUrl = mapUrl;
      config.heroMapUrl = mapUrl;
    }
  }

  // Event Details → ceremony/reception/location cards
  if (Array.isArray(data.weddingDetails) && data.weddingDetails.length) {
    const sorted = [...data.weddingDetails].sort(
      (a, b) => (EventDetailTypeSortOrder[a.type] || 99) - (EventDetailTypeSortOrder[b.type] || 99)
    );

    const churchItem = sorted.find(d => d.type === 'CHURCH' || d.type === 'REGISTRATION');
    if (churchItem) {
      config.ceremonyDate = churchItem.eventDate || '';
      config.ceremonyTime = churchItem.time || '';
      config.ceremonyVenue = t('detailTypes.' + churchItem.type);
      config.ceremonyMapUrl = buildMapUrl(churchItem.location);
    }

    const receptionItem = sorted.find(d => d.type === 'RECEPTION');
    if (receptionItem) {
      config.receptionDate = receptionItem.eventDate || '';
      config.receptionTime = receptionItem.time || '';
      config.receptionVenue = t('detailTypes.' + receptionItem.type);
      config.receptionMapUrl = buildMapUrl(receptionItem.location);
    }
  }

  // Agenda → schedule timeline
  if (Array.isArray(data.agenda) && data.agenda.length) {
    const sorted = [...data.agenda].sort((a, b) => parseTimeToMinutes(a.time || a.startTime || '') - parseTimeToMinutes(b.time || b.startTime || ''));
    config.scheduleEvents = sorted.map((a) => {
      const time = a.time || a.startTime || '';
      const parts = time.match(/^(\d+:\d+)\s*(AM|PM)?$/i);
      const typeKey = a.agendaType || a.type || '';
      return {
        timeValue: parts ? parts[1] : time,
        timePeriod: parts ? (parts[2] || '') : '',
        title: typeKey ? t('agenda.types.' + typeKey) : '',
        description: a.description || '',
      };
    });
  }

  // Our Story
  if (Array.isArray(data.ourStory) && data.ourStory.length) {
    const ourStoryImages = Array.isArray(data.ourStoryImages) ? data.ourStoryImages : [];
    config.stories = data.ourStory.map((s, i) => ({
      imageUrl: ourStoryImages[i] || s.imageUrl || '',
      date: s.date || '',
      title: s.type ? t('storyTypes.' + s.type) : localized(s.titleI18n, s.title),
      description: localized(s.descriptionI18n, s.description),
    }));
  }

  // RSVP
  const rsvpDate = ev.rsvpDeadline || (ev.date ? (() => { const d = new Date(ev.date); d.setDate(d.getDate() - 14); return d.toISOString(); })() : null);
  if (rsvpDate) {
    config.rsvpMessage = t('invitation.rsvpSubtitle', { date: formatDate(rsvpDate) });
  }
}

async function loadGalleryImages() {
  if (!eventId) return;
  try {
    const raw = await mediaService.list(eventId, { page: 0, size: 30 });
    const items = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : [];
    const imageUrls = items
      .filter((m) => m.fileType?.startsWith('image'))
      .map((m) => m.fileUrl || m.url)
      .filter(Boolean);
    if (!imageUrls.length) return;

    if (!config.heroPhotoUrl) {
      config.heroPhotoUrl = imageUrls[0];
    }

    if (!config.galleryPhotos.length) {
      config.galleryPhotos = imageUrls.slice(0, 6).map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
    }
  } catch (e) {
    console.error('Gallery fetch failed:', e);
  }
}

const backendData = ref(null);

async function refreshAllData() {
  const data = await fetchData();
  if (data) {
    backendData.value = data;
    const defaultHero = config.heroPhotoUrl;
    config.heroPhotoUrl = '';
    applyBackendData(data);
    await loadGalleryImages();
    if (!config.heroPhotoUrl) config.heroPhotoUrl = defaultHero;
  }
}

refreshCallback.value = refreshAllData;

// Sync composable items → config so preview updates after CRUD
watch(() => eventDetails.items.value, (items) => {
  if (!items.length) return;
  const sorted = [...items].sort((a, b) => (EventDetailTypeSortOrder[a.type] || 99) - (EventDetailTypeSortOrder[b.type] || 99));
  const churchItem = sorted.find(d => d.type === 'CHURCH' || d.type === 'REGISTRATION');
  if (churchItem) {
    config.ceremonyDate = churchItem.eventDate || '';
    config.ceremonyTime = churchItem.time || '';
    config.ceremonyVenue = t('detailTypes.' + churchItem.type);
    config.ceremonyMapUrl = buildMapUrl(churchItem.location);
  }
  const receptionItem = sorted.find(d => d.type === 'RECEPTION');
  if (receptionItem) {
    config.receptionDate = receptionItem.eventDate || '';
    config.receptionTime = receptionItem.time || '';
    config.receptionVenue = t('detailTypes.' + receptionItem.type);
    config.receptionMapUrl = buildMapUrl(receptionItem.location);
  }
}, { deep: true });

watch(() => agenda.items.value, (items) => {
  if (!items.length) return;
  const sorted = [...items].sort((a, b) => parseTimeToMinutes(a.time || a.startTime || '') - parseTimeToMinutes(b.time || b.startTime || ''));
  config.scheduleEvents = sorted.map(a => {
    const time = a.time || a.startTime || '';
    const parts = time.match(/^(\d+:\d+)\s*(AM|PM)?$/i);
    const typeKey = a.agendaType || a.type || '';
    return {
      timeValue: parts ? parts[1] : time,
      timePeriod: parts ? (parts[2] || '') : '',
      title: typeKey ? t('agenda.types.' + typeKey) : '',
      description: a.description || '',
    };
  });
}, { deep: true });

watch(() => ourStory.items.value, (items) => {
  if (!items.length) return;
  config.stories = items.map(s => ({
    imageUrl: s.imageUrl || '',
    date: s.storyDate || s.date || '',
    title: s.type ? t('storyTypes.' + s.type) : (s.title || ''),
    description: s.description || '',
  }));
}, { deep: true });

function onDetailsAdd() {
  openModal('eventDetail');
}

function onDetailsEdit(item) {
  openModal('eventDetail', item);
}

async function onDetailsDelete(id) {
  await handleEventDetailDelete(id);
}

function onAgendaAdd() {
  openModal('agendaItem');
}

function onAgendaEdit(item) {
  openModal('agendaItem', item);
}

async function onAgendaDelete(id) {
  await handleAgendaDelete(id);
  agenda.loadAgenda();
}

function onOurStoryAdd() {
  openModal('ourStoryItem');
}

function onOurStoryEdit(item) {
  openModal('ourStoryItem', item);
}

async function onOurStoryDelete(id) {
  await handleOurStoryDelete(id);
  ourStory.loadStories();
}

onMounted(async () => {
  const fontLinks = [
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
  ];
  fontLinks.forEach(href => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  });

  await refreshAllData();
  if (isEditMode.value) {
    loadEditData();
    const invConfig = await fetchInvitationConfig();
    loadThemeFromDraft(invConfig);
    setupUnsavedGuard(router);
  }
});

async function onRsvpSubmit(payload) {
  if (!eventId) return;
  try {
    await rsvpService.submitRsvp(eventId, payload);
    const names = payload.guests ? payload.guests.map(g => g.fullName) : [];
    router.push({
      name: 'RsvpSuccessSubmitPage',
      params: { lang: route.params.lang || 'mk' },
      query: { names: JSON.stringify(names) },
    });
  } catch (e) {
    console.error('RSVP submit failed:', e);
  }
}
</script>

<style scoped>
.coastal-breeze {
  font-family: var(--font-body);
  background: #fff;
  color: #374151;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  container-type: inline-size;
}

/* Loading overlay */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f9fafb;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: color-mix(in srgb, var(--theme-accent), black 30%);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Sections */
.section {
  padding: var(--section-padding, 80px 24px);
}

.section--white {
  background: var(--card-bg, #fff);
}

.section--gray {
  background: var(--section-bg, #f9fafb);
}

.section--editing {
  box-shadow: inset 0 0 0 2px #3b82f6;
  position: relative;
  z-index: 1;
}

.section-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 64px;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 40px;
  font-weight: 400;
  color: var(--theme-text);
  margin: 0 0 16px;
}

.section-divider {
  width: 48px;
  height: 1px;
  background: var(--theme-secondary);
  margin: 0 auto;
}

/* Details grid */
.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--content-gap, 32px);
  max-width: 960px;
  margin: 0 auto;
}

:deep(.card-svg) {
  width: 24px;
  height: 24px;
  color: #374151;
}

:deep(.map-link) {
  font-size: 14px;
  color: color-mix(in srgb, var(--theme-accent), black 30%);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.2s ease;
}

:deep(.map-link:hover) {
  color: #3b82f6;
}

:deep(.muted) {
  font-size: 13px !important;
  color: #6b7280 !important;
}

/* Countdown bar */
.countdown-bar {
  margin-top: 48px;
  background: color-mix(in srgb, var(--theme-secondary) 15%, white);
  border-radius: 24px;
  padding: 24px;
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}

/* RSVP */
.rsvp-header {
  text-align: center;
  margin-bottom: 48px;
}

.rsvp-subtitle {
  font-family: var(--font-body);
  font-size: 15px;
  color: #4b5563;
  margin: 24px auto 0;
  max-width: 540px;
}

.rsvp-wrapper {
  max-width: 700px;
  margin: 0 auto;
  background: #f9fafb;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.08);
}

/* Scroll Reveal */
[data-reveal] {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
[data-reveal].revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Responsive — use @container so edit preview responds to frame width */
@container (min-width: 768px) {
  .details-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .rsvp-wrapper {
    padding: 48px;
  }

  .section-title {
    font-size: 48px;
  }
}

@container (max-width: 767px) {
  .section {
    padding: 64px 16px;
  }

  .details-grid {
    max-width: 400px;
    margin: 0 auto;
  }

  .rsvp-wrapper {
    padding: 24px;
  }
}
</style>

<style>
/* In edit mode, skip scroll-reveal animation — sections always visible */
.inv-layout--split [data-reveal] {
  opacity: 1 !important;
  transform: none !important;
}
</style>