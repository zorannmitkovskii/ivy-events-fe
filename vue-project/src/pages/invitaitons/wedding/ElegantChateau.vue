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
  <div ref="rootRef" class="elegant-chateau" :style="rootStyle">
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
        :photos="config.collagePhotos"
        :bride-name="config.brideName"
        :groom-name="config.groomName"
        :tap-label="t('invitation.tapToOpen')"
        :is-edit-mode="isEditMode"
        :edit-label="t('editSection.entry')"
        @fading="mainVisible = true"
        @enter="showEntry = false"
        @edit="openModal('entry')"
      />

      <!-- HERO SECTION -->
      <header v-show="mainVisible" data-edit-section="hero" class="ec-hero" :class="{ 'ec-hero-visible': mainVisible, 'section--editing': isEditMode && activeRootSection === 'hero' }" style="position:relative;">
        <div class="ec-hero-content">
          <p class="ec-hero-label">{{ config.inviteText }}</p>
          <h1 class="ec-hero-names">
            {{ config.brideName }} <span class="ec-hero-amp">&amp;</span><br>{{ config.groomName }}
          </h1>
          <div class="ec-hero-meta">
            <span>{{ config.weddingDate }}</span>
            <span class="ec-hero-dot"></span>
            <span>{{ config.location }}</span>
          </div>
        </div>

        <!-- Hero Image Grid -->
        <div class="ec-hero-grid">
          <div class="ec-hero-main">
            <img :src="config.heroPhotoUrl" alt="Couple" />
          </div>
          <div class="ec-hero-side">
            <div class="ec-hero-side-img">
              <img :src="config.collagePhotos[0].url" :alt="config.collagePhotos[0].alt" />
            </div>
            <div class="ec-hero-side-quote">
              <p class="ec-quote-text">"{{ config.heroQuote || t('invitation.heroQuote') }}"</p>
            </div>
          </div>
        </div>
      </header>

      <!-- OUR STORY SLIDER -->
      <section v-if="(isEditMode || showOurStory) && isSectionVisible('ourStoryList')" v-show="mainVisible" id="story-section" data-edit-section="ourStoryList" :class="['ec-section ec-section--white', { 'section--editing': isEditMode && activeRootSection === 'ourStoryList' }]" data-reveal style="position:relative;">
        <div class="ec-section-inner">
          <div class="ec-story-header">
            <div>
              <h2 class="ec-section-title">{{ t('invitation.ourStory') }}</h2>
              <p class="ec-section-subtitle">{{ t('invitation.storySubtitle') }}</p>
            </div>
            <div class="ec-slider-arrows">
              <button class="ec-arrow-btn" @click="scrollSlider('left')" aria-label="Previous">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              </button>
              <button class="ec-arrow-btn" @click="scrollSlider('right')" aria-label="Next">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div ref="sliderRef" class="ec-slider">
          <div v-for="(story, i) in config.stories" :key="i" class="ec-slide">
            <div class="ec-slide-card">
              <div class="ec-slide-image">
                <img v-if="story.imageUrl" :src="story.imageUrl" :alt="story.title" />
                <div v-if="story.date" class="ec-slide-date">{{ story.date }}</div>
              </div>
              <div class="ec-slide-body">
                <h3 class="ec-slide-title">{{ story.title }}</h3>
                <p class="ec-slide-text">{{ story.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- DETAILS SECTION -->
      <section v-if="(isEditMode || (showAgenda && !isPrivate)) && isSectionVisible('details')" v-show="mainVisible" id="details-section" data-edit-section="details" :class="['ec-section ec-section--warm', { 'section--editing': isEditMode && activeRootSection === 'details' }]" data-reveal style="position:relative;">
        <div class="ec-section-inner">
          <div class="ec-section-header-center">
            <h2 class="ec-section-title">{{ t('invitation.theWeddingWeekend') }}</h2>
            <p class="ec-section-subtitle">{{ t('invitation.celebrateWithUs') }}</p>
          </div>

          <!-- Countdown -->
          <div class="ec-countdown-wrap">
            <CountdownTimer
              :target-date="config.weddingDateTime"
              :show-seconds="false"
              :colors="[palette.accent, palette.accent]"
              :heading-font="fonts.heading"
              :body-font="fonts.body"
              unit-label-color="#666666"
            />
          </div>

          <div class="ec-details-grid">
            <div
              v-for="(detail, i) in config.weddingDetails"
              :key="i"
              class="ec-detail-card"
              :class="{ 'ec-detail-card--highlight': detail.highlight }"
            >
              <div class="ec-detail-icon">
                <svg v-if="detail.icon === 'drinks'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8h14z"/></svg>
                <svg v-else-if="detail.icon === 'heart'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                <svg v-else-if="detail.icon === 'coffee'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3 class="ec-detail-title">{{ detail.title }}</h3>
              <p v-if="detail.eventDate" class="ec-detail-time ec-detail-time--bold">{{ detail.eventDate }}</p>
              <p v-if="detail.time" class="ec-detail-time">{{ detail.time }}</p>
              <a v-if="detail.mapUrl" :href="detail.mapUrl" target="_blank" rel="noopener" class="ec-detail-map">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ t('invitation.viewLocation') }}
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- RSVP SECTION -->
      <section v-if="isSectionVisible('rsvp')" v-show="mainVisible" id="rsvp-section" data-edit-section="rsvp" :class="['ec-section ec-section--white ec-section--rsvp', { 'section--editing': isEditMode && activeRootSection === 'rsvp' }]" data-reveal>
        <div class="ec-rsvp-bg"></div>
        <div class="ec-section-inner ec-section-inner--narrow ec-rsvp-content">
          <div class="ec-section-header-center">
            <h2 class="ec-section-title ec-section-title--large">{{ t('invitation.willYouJoinUs') }}</h2>
          </div>

          <div class="ec-rsvp-form-wrap">
            <RsvpForm
              title=""
              :subtitle="t('invitation.rsvpKindlyRespond', { date: config.rsvpDeadline })"
              :name-label="t('invitation.fullName')"
              :name-placeholder="t('invitation.namePlaceholder')"
              :add-guest-label="t('invitation.addGuest')"
              :accept-label="t('invitation.joyfullyAccepts')"
              :decline-label="t('invitation.regretfullyDeclines')"
              :message-label="t('invitation.yourMessage')"
              :message-placeholder="t('invitation.messagePlaceholder')"
              :submit-label="t('invitation.sendRsvp')"
              :accent-color="palette.accent"
              :accept-color="palette.secondary"
              :decline-color="palette.neutral200"
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

    <template v-if="isEditMode" #section-entry="{ subTab }">
      <template v-if="subTab === 'content'">
        <EditEntryModal
          :open="true"
          :live-edit="true"
          :current-type="entryType"
          :current-design="entryDesign"
          @close="toggleSection('entry')"
          @change="onEntryChange"
        />
      </template>
      <SectionLayoutPicker v-if="subTab === 'layout'" :layouts="SECTION_LAYOUTS.entry || []" :current="sectionLayouts.entry" @select="setLayout('entry', $event); markDirty()" />
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="entry" :visible="isSectionVisible('entry')" :anchor-id="sectionAdvancedState.entry?.anchorId || ''" :animation="sectionAdvancedState.entry?.animation || 'none'" :overrides="sectionOverrides.entry || null" @update="onAdvancedUpdate('entry', $event)" />
    </template>

    <template v-if="isEditMode" #section-hero="{ subTab }">
      <template v-if="subTab === 'content'">
        <EditHeroModal
          :open="true"
          :live-edit="true"
          :event="heroEventData"
          @close="toggleSection('hero')"
          @updated="refreshAllData"
          @change="onHeroChange"
        />
      </template>
      <SectionLayoutPicker v-if="subTab === 'layout'" :layouts="SECTION_LAYOUTS.hero || []" :current="sectionLayouts.hero" @select="setLayout('hero', $event); markDirty()" />
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="hero" :visible="isSectionVisible('hero')" :anchor-id="sectionAdvancedState.hero?.anchorId || ''" :animation="sectionAdvancedState.hero?.animation || 'none'" :overrides="sectionOverrides.hero || null" @update="onAdvancedUpdate('hero', $event)" />
    </template>

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

    <template v-if="isEditMode" #section-ourStoryList="{ subTab }">
      <template v-if="subTab === 'content'">
        <EditOurStoryModal
          v-if="!editingItem && activeModal === 'ourStoryList'"
          :open="true"
          :items="ourStory.items.value"
          :max-items="3"
          :field-config="OUR_STORY_FIELD_CONFIG['elegant-chateau']"
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

    <template v-if="isEditMode" #section-collage>
      <EditCollageModal
        :open="true"
        @close="toggleSection('collage')"
        @updated="refreshAllData"
        @files-collected="onCollageFiles"
      />
    </template>

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

    <template v-if="isEditMode" #section-rsvp="{ subTab }">
      <template v-if="subTab === 'content'">
        <EditRsvpModal
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
      </template>
      <SectionLayoutPicker v-if="subTab === 'layout'" :layouts="SECTION_LAYOUTS.rsvp || []" :current="sectionLayouts.rsvp" @select="setLayout('rsvp', $event); markDirty()" />
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="rsvp" :visible="isSectionVisible('rsvp')" :anchor-id="sectionAdvancedState.rsvp?.anchorId || ''" :animation="sectionAdvancedState.rsvp?.animation || 'none'" :overrides="sectionOverrides.rsvp || null" @update="onAdvancedUpdate('rsvp', $event)" />
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
import { reactive, ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { rsvpService } from '@/services/rsvp.service';
 import { mediaService } from '@/services/media.service';
import { useInvitationData } from '@/composables/useInvitationData';
import { useScrollReveal } from '@/composables/useScrollReveal';
import { buildLocationAddress, buildMapUrl, formatTimeRange } from '@/utils/invitation';
import { getFutureWeddingDate, formatWeddingDate, toLocalISO, formatRsvpDeadline } from '@/utils/date.js';
import { EventDetailTypeSortOrder } from '@/enums/EventDetailType';
import CountdownTimer from '@/components/invitations/shared/CountdownTimer.vue';
import RsvpForm from '@/components/invitations/shared/RsvpForm.vue';
import InvitationEntry from '@/components/invitations/entries/InvitationEntry.vue';
import EditEntryModal from '@/components/modals/EditEntryModal.vue';
import EditColorsModal from '@/components/modals/EditColorsModal.vue';
import EditFontsModal from '@/components/modals/EditFontsModal.vue';
import { invitationPhotosApi } from '@/services/invitationPhotos.service';
import { useInvitationEditMode } from '@/composables/useInvitationEditMode';
import { useToast } from '@/composables/useToast';
import { getDraftTheme, setDraftTheme, getDraftSectionState, setDraftSectionState, setDraftFullPayload } from '@/store/invitationDraft.store';
import { isAuthenticated } from '@/services/auth.service';
import AddAgendaItemModal from '@/components/modals/AddAgendaItemModal.vue';
import AddOurStoryModal from '@/components/modals/AddOurStoryModal.vue';
import OurStoryUploadModal from '@/components/modals/OurStoryUploadModal.vue';
import EditOurStoryModal from '@/components/modals/EditOurStoryModal.vue';
import { OUR_STORY_FIELD_CONFIG } from '@/config/ourStoryFieldConfig.js';
import EditCollageModal from '@/components/modals/EditCollageModal.vue';
import EditHeroModal from '@/components/modals/EditHeroModal.vue';
import EditDetailsModal from '@/components/modals/EditDetailsModal.vue';
import AddEventDetailModal from '@/components/modals/AddEventDetailModal.vue';
import { buildEventFullPayload } from '@/utils/buildEventFullPayload';
import EditAgendaModal from '@/components/modals/EditAgendaModal.vue';
import EditRsvpModal from '@/components/modals/EditRsvpModal.vue';
import EditButtonsModal from '@/components/modals/EditButtonsModal.vue';
import EditBackgroundModal from '@/components/modals/EditBackgroundModal.vue';
import EditSpacingModal from '@/components/modals/EditSpacingModal.vue';
import InvitationEditLayout from '@/components/invitations/shared/InvitationEditLayout.vue';
import EditInfoPanel from '@/components/invitations/shared/EditInfoPanel.vue';
import { useSectionState } from '@/composables/useSectionState';
import SectionLayoutPicker from '@/components/invitations/shared/SectionLayoutPicker.vue';
import SectionAdvanced from '@/components/invitations/shared/SectionAdvanced.vue';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const { eventId, loading, localized, formatDate, formatTime, fetchData } = useInvitationData();

const {
  isEditMode, activeModal, activeRootSection, editingItem,
  openModal, closeModal, closeAllModals, refreshCallback, agenda, eventDetails, ourStory,
  handleAgendaSave, handleAgendaUpdate, handleAgendaDelete,
  handleEventDetailSave, handleEventDetailUpdate, handleEventDetailDelete,
  handleOurStorySave, handleOurStoryUpdate, handleOurStoryDelete,
  loadEditData, fetchInvitationConfig,
  dirty, previewMode, markDirty, clearDirty, toggleSection, selectSection, setupUnsavedGuard,
  saveFullEvent, saving,
} = useInvitationEditMode();
const toast = useToast();

const rootRef = ref(null);
const entryRef = ref(null);
const showAgenda = ref(true);
const showOurStory = ref(true);
const isPrivate = computed(() => route.query.isPrivate === 'true');
const showEntry = ref(true);
const mainVisible = ref(false);
const entryType = ref('gallery');
const entryDesign = ref('polaroid');

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

const sectionAdvancedState = reactive({});

const sectionStatuses = computed(() => {
  const result = {};
  SIDEBAR_SECTIONS.filter(s => s.tab === 'sections').forEach(s => {
    result[s.key] = getSectionStatus(s.key, config);
  });
  return result;
});

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
    if (loc.name) config.location = loc.name;
    else if (loc.address) config.location = loc.address;
    config.locationLat = loc.lat || null;
    config.locationLng = loc.lng || null;
    const mapUrl = buildMapUrl({ latitude: loc.lat, longitude: loc.lng });
    if (mapUrl) config.heroMapUrl = mapUrl;
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
    try {
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
        invitationName: 'elegant-chateau',
        lang: locale.value,
      });
      await saveFullEvent(payload, { heroImage: heroFile.value, ourStoryImages: ourStoryFiles.value.length ? ourStoryFiles.value : undefined, collageImages: collageFiles.value.length ? collageFiles.value : undefined });
      clearDirty();
      await router.push({ name: 'dashboard.overview', params: { lang: locale.value } });
    } catch (e) {
      toast.apiError(e);
    }
    return;
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
      invitationName: 'elegant-chateau',
      lang: locale.value,
    });
    saveThemeToDraft();
    setDraftFullPayload(payload);
    clearDirty();
    router.push({ name: 'signup', params: { lang: locale.value } });
    return;
  }
}
const sliderRef = ref(null);

useScrollReveal(rootRef);

const DEFAULT_PALETTE = {
  accent: '#9f8274',
  secondary: '#eaddd7',
  text: '#1a1a1a',
  background: '#f9f8f6',
  backgroundWarm: '#f2efe9',
  neutral200: '#c8c8c8',
};

const DEFAULT_FONTS = {
  heading: "'Playfair Display', serif",
  body: "'Lato', sans-serif",
};

const palette = reactive({ ...DEFAULT_PALETTE });
const fonts = reactive({ ...DEFAULT_FONTS });

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

const COLOR_FIELDS = [
  { key: 'accent', label: t('editSection.accentColor') },
  { key: 'secondary', label: t('editSection.secondaryColor') },
  { key: 'text', label: t('editSection.textColor') },
  { key: 'background', label: t('editSection.backgroundColor') },
];

const PALETTE_PRESETS = [
  { name: 'Mocha', colors: { accent: '#9f8274', secondary: '#eaddd7', text: '#1a1a1a', background: '#f9f8f6' } },
  { name: 'Sage', colors: { accent: '#6b8e6b', secondary: '#d4e4d4', text: '#1a2e1a', background: '#f5f9f5' } },
  { name: 'Navy', colors: { accent: '#b8860b', secondary: '#e6d5b8', text: '#1b2838', background: '#f8f6f0' } },
  { name: 'Slate', colors: { accent: '#6b8cae', secondary: '#d5e2ee', text: '#1a2838', background: '#f5f8fb' } },
  { name: 'Wine', colors: { accent: '#8b3a3a', secondary: '#e8d2d2', text: '#2d1515', background: '#faf5f5' } },
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
  '--theme-bg': palette.background,
  '--theme-bg-warm': palette.backgroundWarm,
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
    theme = invConfig.theme;
    rsvpData = invConfig.rsvpConfig;
    entry = invConfig.entry;
    if (invConfig.sectionOrder) {
      const order = Object.entries(invConfig.sectionOrder).sort(([,a],[,b]) => a - b).map(([k]) => k);
      sectionState = { order, visibility: invConfig.sectionVisibility || {}, layouts: invConfig.sectionLayouts || {} };
    }
  } else if (!isAuthenticated()) {
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

const _futureDate = getFutureWeddingDate();
const _dayBefore = new Date(_futureDate); _dayBefore.setDate(_dayBefore.getDate() - 1);
const _dayAfter = new Date(_futureDate); _dayAfter.setDate(_dayAfter.getDate() + 1);
function _shortDate(d) { return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }); }

const config = reactive({
  brideName: 'Sophie',
  groomName: 'Alexander',
  weddingDate: formatWeddingDate(_futureDate),
  weddingDateTime: toLocalISO(_futureDate, '16:00:00'),
  inviteText: t('invitation.weAreGettingMarried'),
  location: 'Chateau de Santeny, France',
  heroMapUrl: '',
  ctaLabel: 'RSVP',
  heroPhotoUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1600&q=80',
  heroQuote: '',

  collagePhotos: [
    { url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1000&q=80', alt: 'Wedding detail' },
    { url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1000&q=80', alt: 'Couple laughing' },
    { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1000&q=80', alt: 'Main photo' },
  ],

  weddingDetails: [
    {
      icon: 'drinks',
      title: 'Welcome Drinks',
      eventDate: _shortDate(_dayBefore),
      time: '6:00 PM',
      description: '',
      mapUrl: '',
      highlight: false,
    },
    {
      icon: 'heart',
      title: 'The Ceremony',
      eventDate: _shortDate(_futureDate),
      time: '4:00 PM',
      description: '',
      mapUrl: '',
      highlight: true,
    },
    {
      icon: 'coffee',
      title: 'Farewell Brunch',
      eventDate: _shortDate(_dayAfter),
      time: '10:00 AM',
      description: '',
      mapUrl: '',
      highlight: false,
    },
  ],

  storyTitle: 'Our Story',
  stories: [
    {
      date: '2019',
      title: 'The First Encounter',
      text: 'It started with a spilled latte in a crowded Parisian cafe. Alexander offered his napkin, Sophie offered a laugh, and three hours later, neither wanted to leave.',
      imageUrl: 'https://images.unsplash.com/photo-1522673607200-1645062cd958?w=1000&q=80',
    },
    {
      date: '2022',
      title: 'The Yes',
      text: 'On a quiet hike through the Swiss Alps, surrounded by nothing but snow and silence, Alexander got down on one knee. It was the easiest question Sophie ever answered.',
      imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1000&q=80',
    },
    {
      date: '2023',
      title: 'Building a Life',
      text: 'From adopting our golden retriever, Barnaby, to renovating our first apartment, every day has been an adventure we\'re grateful to share together.',
      imageUrl: 'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?w=1000&q=80',
    },
  ],

  rsvpDeadline: formatRsvpDeadline(_futureDate),
});

function scrollSlider(direction) {
  if (!sliderRef.value) return;
  const amount = direction === 'left' ? -420 : 420;
  sliderRef.value.scrollBy({ left: amount, behavior: 'smooth' });
}

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
  }

  const subtitle = localized(ev.messageI18n, ev.message);
  if (subtitle) config.inviteText = subtitle;

  if (data.location) {
    const loc = data.location;
    const locationStr = [loc.city, loc.country].filter(Boolean).join(', ')
      || loc.venueName || loc.address || '';
    if (locationStr) config.location = locationStr;
    const mapUrl = buildMapUrl(loc);
    if (mapUrl) config.heroMapUrl = mapUrl;
  }

  // Event Details → detail cards with highlight on ceremony-type items
  const ceremonyTypes = ['CEREMONY', 'CHURCH', 'REGISTRATION'];
  if (Array.isArray(data.weddingDetails) && data.weddingDetails.length) {
    const sorted = [...data.weddingDetails].sort(
      (a, b) => (EventDetailTypeSortOrder[a.type] || 99) - (EventDetailTypeSortOrder[b.type] || 99)
    );

    const typeToIcon = {
      REGISTRATION: 'heart', CHURCH: 'heart', RECEPTION: 'drinks',
      LOCATION: 'coffee', COUNTDOWN: 'heart',
    };

    config.weddingDetails = sorted.map((d) => ({
      icon: typeToIcon[d.type] || 'heart',
      title: t('detailTypes.' + d.type) || '',
      eventDate: d.eventDate || '',
      time: d.time || '',
      description: '',
      mapUrl: buildMapUrl(d.location),
      highlight: ceremonyTypes.includes(d.type),
    }));
  }

  // Our Story (NOT from agenda — that was a bug)
  if (Array.isArray(data.ourStory) && data.ourStory.length) {
    const ourStoryImages = Array.isArray(data.ourStoryImages) ? data.ourStoryImages : [];
    config.stories = data.ourStory.map((s, i) => ({
      date: s.date || '',
      title: s.type ? t('storyTypes.' + s.type) : localized(s.titleI18n, s.title),
      text: localized(s.descriptionI18n, s.description),
      imageUrl: ourStoryImages[i] || s.imageUrl || '',
    }));
  }

  if (ev.rsvpDeadline) {
    config.rsvpDeadline = formatDate(ev.rsvpDeadline);
  } else if (ev.date) {
    const d = new Date(ev.date); d.setDate(d.getDate() - 14);
    config.rsvpDeadline = formatDate(d.toISOString());
  }
}

async function loadCollagePhotos() {
  if (!eventId) return;
  try {
    const data = await invitationPhotosApi.list(eventId);
    const photos = Array.isArray(data) ? data : [];
    if (photos.length) {
      config.collagePhotos = photos
        .filter((p) => p.url)
        .slice(0, 3)
        .map((p, i) => ({ url: p.url, thumbUrl: p.thumbUrl || p.url, alt: `Photo ${i + 1}` }));
    }
  } catch (e) {
    console.error('Collage photos fetch failed:', e);
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

    if (!config.collagePhotos.length) {
      config.collagePhotos = imageUrls.slice(0, 3).map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
    }
  } catch (e) {
    console.error('Gallery fetch failed:', e);
  }
}

onMounted(async () => {
  const fontLinks = [
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap',
    'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
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

// Edit mode: data refresh after modal saves
const backendData = ref(null);

async function refreshAllData() {
  const data = await fetchData();
  if (data) {
    backendData.value = data;
    const defaultHero = config.heroPhotoUrl;
    const defaultCollage = [...config.collagePhotos];
    config.heroPhotoUrl = '';
    config.collagePhotos = [];
    applyBackendData(data);
    await loadCollagePhotos();
    await loadGalleryImages();
    if (!config.heroPhotoUrl) config.heroPhotoUrl = defaultHero;
    if (!config.collagePhotos.length) config.collagePhotos = defaultCollage;
  }
}

refreshCallback.value = refreshAllData;

// Sync composable items → config so preview updates after CRUD
const ceremonyTypes = ['CEREMONY', 'CHURCH', 'REGISTRATION'];
const typeToIconMap = {
  REGISTRATION: 'heart', CHURCH: 'heart', RECEPTION: 'drinks',
  LOCATION: 'coffee', COUNTDOWN: 'heart',
};

watch(() => eventDetails.items.value, (items) => {
  if (!items.length) return;
  const sorted = [...items].sort((a, b) => (EventDetailTypeSortOrder[a.type] || 99) - (EventDetailTypeSortOrder[b.type] || 99));
  config.weddingDetails = sorted.map(d => ({
    icon: typeToIconMap[d.type] || 'heart',
    title: t('detailTypes.' + d.type) || '',
    eventDate: d.eventDate || '',
    time: d.time || '',
    description: '',
    mapUrl: buildMapUrl(d.location),
    highlight: ceremonyTypes.includes(d.type),
  }));
}, { deep: true });

watch(() => ourStory.items.value, (items) => {
  if (!items.length) return;
  config.stories = items.map(s => ({
    date: s.storyDate || s.date || '',
    title: s.type ? t('storyTypes.' + s.type) : (s.title || ''),
    text: s.description || '',
    imageUrl: s.imageUrl || '',
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
.elegant-chateau {
  font-family: var(--font-body);
  background: var(--theme-bg);
  color: var(--theme-text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  container-type: inline-size;
}

/* Loading */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--theme-bg);
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--theme-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ========== HERO ========== */
.ec-hero {
  padding: 80px 24px 80px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 1s ease-out 0.5s, transform 1s ease-out 0.5s;
}
.ec-hero-visible {
  opacity: 1;
  transform: translateY(0);
}
.ec-hero-content {
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
}
.ec-hero-label {
  font-size: 13px;
  color: color-mix(in srgb, var(--theme-accent), black 15%);
  text-transform: uppercase;
  letter-spacing: 3px;
  margin: 0 0 24px;
}
.ec-hero-names {
  font-family: var(--font-heading);
  font-size: 64px;
  color: var(--theme-text);
  margin: 0 0 32px;
  line-height: 1.05;
  letter-spacing: -0.02em;
}
.ec-hero-amp {
  font-style: italic;
  color: #a4a4a4;
}
.ec-hero-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  color: #434343;
}
.ec-hero-dot {
  display: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c8c8c8;
}
@container (min-width: 768px) {
  .ec-hero-names { font-size: 96px; }
  .ec-hero-meta { flex-direction: row; gap: 48px; }
  .ec-hero-dot { display: block; }
  .ec-hero { padding-top: 128px; padding-bottom: 128px; }
}
@container (min-width: 1024px) {
  .ec-hero-names { font-size: 120px; }
}

/* Hero Image Grid */
.ec-hero-grid {
  max-width: 1280px;
  margin: 64px auto 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 0 16px;
}
.ec-hero-main {
  height: 400px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px -5px rgba(40, 40, 40, 0.1);
}
.ec-hero-main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s ease;
}
.ec-hero-main:hover img { transform: scale(1.05); }
.ec-hero-side { display: none; }
@container (min-width: 768px) {
  .ec-hero-grid { grid-template-columns: 8fr 4fr; }
  .ec-hero-main { height: 600px; }
  .ec-hero-side {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
.ec-hero-side-img {
  height: 290px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px -5px rgba(40, 40, 40, 0.1);
}
.ec-hero-side-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s ease;
}
.ec-hero-side-img:hover img { transform: scale(1.05); }
.ec-hero-side-quote {
  height: 290px;
  border-radius: 16px;
  background: var(--theme-bg-warm);
  box-shadow: 0 10px 30px -5px rgba(40, 40, 40, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}
.ec-quote-text {
  font-family: var(--font-heading);
  font-size: 28px;
  font-style: italic;
  color: var(--theme-text);
  text-align: center;
  margin: 0;
}

/* ========== SECTIONS ========== */
.ec-section { padding: var(--section-padding, 96px 24px); }
.ec-section--white { background: var(--card-bg, #fff); }
.ec-section--warm { background: var(--section-bg, var(--theme-bg-warm)); }
.ec-section-inner { max-width: 1280px; margin: 0 auto; }
.ec-section-inner--narrow { max-width: 750px; }
.ec-section-header-center { text-align: center; margin-bottom: 48px; }
.ec-section-title {
  font-family: var(--font-heading);
  font-size: 36px;
  font-weight: 400;
  color: var(--theme-text);
  margin: 0 0 16px;
}
.ec-section-title--large { font-size: 42px; }
.ec-section-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
  max-width: 500px;
}
@container (min-width: 768px) {
  .ec-section-title { font-size: 48px; }
  .ec-section-title--large { font-size: 56px; }
}

/* ========== STORY SLIDER ========== */
.ec-story-header {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 48px;
  padding: 0 24px;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
}
@container (min-width: 768px) {
  .ec-story-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
}
.ec-slider-arrows {
  display: flex;
  gap: 8px;
}
.ec-arrow-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid #e3e3e3;
  background: #fff;
  color: #666;
  cursor: pointer;
  transition: background 0.2s;
}
.ec-arrow-btn:hover { background: #f7f7f7; }

.ec-slider {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 24px;
  padding: 0 24px 48px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.ec-slider::-webkit-scrollbar { display: none; }

.ec-slide {
  min-width: 85vw;
  scroll-snap-align: center;
  flex-shrink: 0;
}
@container (min-width: 768px) {
  .ec-slide { width: 600px; }
}
.ec-slide-card {
  background: var(--card-bg, var(--theme-bg));
  border-radius: var(--card-radius, 16px);
  overflow: hidden;
  box-shadow: var(--card-shadow, 0 10px 30px -5px rgba(40, 40, 40, 0.1));
}
.ec-slide-image {
  height: 400px;
  overflow: hidden;
  position: relative;
}
.ec-slide-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s ease;
}
.ec-slide-card:hover .ec-slide-image img { transform: scale(1.05); }
.ec-slide-date {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--theme-text);
}
.ec-slide-body { padding: 32px; }
.ec-slide-title {
  font-family: var(--font-heading);
  font-size: 24px;
  color: var(--theme-text);
  margin: 0 0 12px;
}
.ec-slide-text {
  font-size: 15px;
  color: #666;
  line-height: 1.7;
  margin: 0;
}

/* ========== COUNTDOWN ========== */
.ec-countdown-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 48px;
}

/* ========== DETAILS ========== */
.ec-details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--content-gap, 32px);
}
@container (min-width: 768px) {
  .ec-details-grid { grid-template-columns: repeat(3, 1fr); }
}
.ec-detail-card {
  background: var(--card-bg, #fff);
  padding: var(--card-padding, 32px);
  border-radius: var(--card-radius, 16px);
  box-shadow: var(--card-shadow, 0 10px 30px -5px rgba(40, 40, 40, 0.1));
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.ec-detail-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--card-shadow, 0 20px 40px -5px rgba(40, 40, 40, 0.15));
}
.ec-detail-card--highlight {
  border-top: 4px solid var(--theme-accent);
}
.ec-detail-icon {
  width: 48px;
  height: 48px;
  background: var(--theme-bg-warm);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: color-mix(in srgb, var(--theme-accent), black 15%);
}
.ec-detail-icon svg { width: 24px; height: 24px; }
.ec-detail-title {
  font-family: var(--font-heading);
  font-size: 24px;
  color: var(--theme-text);
  margin: 0 0 8px;
}
.ec-detail-time {
  font-size: 13px;
  font-weight: 700;
  color: color-mix(in srgb, var(--theme-accent), black 15%);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 8px;
}

.ec-detail-time--bold {
  font-weight: 800;
}
.ec-detail-desc {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 20px;
}
.ec-detail-map {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: color-mix(in srgb, var(--theme-accent), black 15%);
  text-decoration: none;
  padding: 8px 16px;
  border: 1px solid var(--theme-secondary);
  border-radius: 999px;
  transition: all 0.2s;
}
.ec-detail-map:hover {
  background: var(--theme-bg);
  border-color: var(--theme-accent);
}

/* ========== RSVP ========== */
.ec-section--rsvp { position: relative; overflow: hidden; }
.ec-rsvp-bg {
  position: absolute;
  inset: 0;
  opacity: 0.04;
  pointer-events: none;
  background-image: url('https://images.unsplash.com/photo-1519741497674-611481863552?w=2000&q=40');
  background-size: cover;
  background-position: center;
}
.ec-rsvp-content { position: relative; z-index: 10; }
.ec-rsvp-form-wrap {
  background: var(--card-bg, var(--theme-bg));
  padding: var(--card-padding, 32px);
  border-radius: var(--card-radius, 16px);
  box-shadow: var(--card-shadow, 0 10px 30px -5px rgba(40, 40, 40, 0.1));
}
@container (min-width: 768px) {
  .ec-rsvp-form-wrap { padding: 48px; }
}

/* ========== SCROLL REVEAL ========== */
[data-reveal] {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
[data-reveal].revealed {
  opacity: 1;
  transform: translateY(0);
}

/* ========== RESPONSIVE ========== */
@container (max-width: 767px) {
  .ec-section { padding: 64px 16px; }
  .ec-hero-names { font-size: 48px; }
}

.section--editing {
  box-shadow: inset 0 0 0 2px #3b82f6;
  position: relative;
  z-index: 1;
}
</style>

<style>
/* In edit mode, skip scroll-reveal animation — sections always visible */
.inv-layout--split [data-reveal] {
  opacity: 1 !important;
  transform: none !important;
}
</style>
