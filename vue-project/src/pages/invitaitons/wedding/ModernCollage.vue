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
  <div ref="rootRef" class="modern-collage" :style="rootStyle">
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
        :wedding-date="config.weddingDate"
        :tap-label="t('invitation.tapToEnter')"
        :is-edit-mode="isEditMode"
        :edit-label="t('editSection.entry')"
        @enter="showEntry = false"
        @edit="openModal('entry')"
      />

      <!-- HERO SECTION -->
      <section v-show="!showEntry" class="hero-section" data-reveal style="position:relative;" data-edit-section="hero" :class="{ 'section--editing': isEditMode && activeRootSection === 'hero' }">
        <div class="hero-bg">
          <img :src="config.heroPhotoUrl" alt="Hero" class="hero-img" />
          <div class="hero-overlay"></div>
        </div>

        <div class="hero-content">
          <p class="hero-subtitle">{{ config.inviteText }}</p>
          <h1 class="hero-names">{{ config.brideName }} & {{ config.groomName }}</h1>
          <div class="hero-divider"></div>
          <p class="hero-details">{{ config.weddingDate }} &bull; {{ config.location }}</p>

          <div class="hero-actions">
            <a href="#rsvp-section" class="hero-btn hero-btn--primary">{{ t('invitation.rsvpNow') }}</a>
            <a v-if="config.heroMapUrl" :href="config.heroMapUrl" target="_blank" rel="noopener" class="hero-btn hero-btn--outline">{{ t('invitation.viewMap') }}</a>
          </div>
        </div>

        <div class="hero-scroll-hint">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </section>

      <!-- DETAILS SECTION -->
      <section v-show="!showEntry" v-if="isSectionVisible('details')" id="details-section" :class="['section section--cream', { 'section--editing': isEditMode && activeRootSection === 'details' }]" data-reveal style="position:relative;" data-edit-section="details">
        <div class="section-inner">
          <div class="section-header">
            <h2 class="section-title">{{ t('invitation.countingDown') }}</h2>
          </div>

          <div class="countdown-wrap">
            <CountdownTimer
              :target-date="config.weddingDateTime"
              :show-seconds="false"
              :colors="[palette.accent, palette.accent]"
              :heading-font="fonts.heading"
              :body-font="fonts.body"
              unit-label-color="#78716c"
            />
          </div>

          <div class="details-grid">
            <!-- Ceremony Card -->
            <div class="detail-card detail-card--rose">
              <div class="detail-icon detail-icon--rose">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 21V8a6 6 0 0 0-12 0v13"/><path d="M2 21h20"/><path d="M12 2v4"/><path d="M10 12h4"/>
                </svg>
              </div>
              <h3 class="detail-title">{{ config.ceremonyVenue || t('invitation.theCeremony') }}</h3>
              <p v-if="config.ceremonyDate" class="detail-time bold">{{ config.ceremonyDate }}</p>
              <p v-if="config.ceremonyTime" class="detail-time">{{ config.ceremonyTime }}</p>
              <a v-if="config.ceremonyMapUrl" :href="config.ceremonyMapUrl" target="_blank" rel="noopener" class="detail-map-link detail-map-link--rose">{{ t('invitation.getDirections') }}</a>
            </div>

            <!-- Reception Card -->
            <div class="detail-card detail-card--stone">
              <div class="detail-icon detail-icon--stone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-1-3.5-1-3.5H8S7 8 7 10a5 5 0 0 0 5 5z"/><path d="M12 10V2"/>
                </svg>
              </div>
              <h3 class="detail-title">{{ config.receptionVenue || t('invitation.theReception') }}</h3>
              <p v-if="config.receptionDate" class="detail-time bold">{{ config.receptionDate }}</p>
              <p v-if="config.receptionTime" class="detail-time">{{ config.receptionTime }}</p>
              <a v-if="config.receptionMapUrl" :href="config.receptionMapUrl" target="_blank" rel="noopener" class="detail-map-link detail-map-link--stone">{{ t('invitation.getDirections') }}</a>
            </div>
          </div>

        </div>
      </section>

      <!-- AGENDA SECTION -->
      <section v-if="(isEditMode || (showAgenda && !isPrivate)) && isSectionVisible('agendaList')" v-show="!showEntry" id="agenda-section" :class="['section section--white', { 'section--editing': isEditMode && activeRootSection === 'agendaList' }]" data-reveal style="position:relative;" data-edit-section="agendaList">
        <div class="section-inner">
          <div class="section-header">
            <h2 class="section-title">{{ t('invitation.orderOfEvents') }}</h2>
            <p class="section-subtitle">{{ t('invitation.celebrateWithUs') }}</p>
          </div>

          <EventTimeline
            title=""
            :events="config.agendaEvents"
            :line-color="palette.stone200"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
          />
        </div>
      </section>

      <!-- OUR STORY SECTION -->
      <section v-if="(isEditMode || showOurStory) && isSectionVisible('ourStoryList')" v-show="!showEntry" id="story-section" :class="['section section--cream', { 'section--editing': isEditMode && activeRootSection === 'ourStoryList' }]" data-reveal style="position:relative;" data-edit-section="ourStoryList">
        <div class="section-inner">
          <div class="section-header">
            <h2 class="section-title">{{ t('invitation.ourLoveStory') }}</h2>
            <div class="section-divider"></div>
          </div>

          <div class="story-grid">
            <div v-for="(story, i) in config.stories" :key="i" class="story-card">
              <div v-if="story.imageUrl" class="story-image">
                <img :src="story.imageUrl" :alt="story.title" />
              </div>
              <div class="story-body">
                <div v-if="story.date" class="story-date">{{ story.date }}</div>
                <h3 class="story-card-title">{{ story.title }}</h3>
                <p class="story-text">{{ story.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- RSVP SECTION -->
      <section v-show="!showEntry" v-if="isSectionVisible('rsvp')" id="rsvp-section" :class="['section section--dark', { 'section--editing': isEditMode && activeRootSection === 'rsvp' }]" data-reveal data-edit-section="rsvp">
        <div class="section-inner section-inner--narrow">
          <div class="rsvp-glow rsvp-glow--left"></div>
          <div class="rsvp-glow rsvp-glow--right"></div>

          <RsvpForm
            :title="t('invitation.rsvp')"
            :subtitle="t('invitation.rsvpSubtitle', { date: config.rsvpDeadline })"
            :name-label="t('invitation.fullName')"
            :name-placeholder="t('invitation.namePlaceholder')"
            :add-guest-label="t('invitation.addGuest')"
            :accept-label="t('invitation.joyfullyAccept')"
            :decline-label="t('invitation.regretfullyDecline')"
            :message-label="t('invitation.yourMessage')"
            :message-placeholder="t('invitation.messagePlaceholder')"
            :submit-label="t('invitation.sendRsvp')"
            :accent-color="palette.accent"
            :accept-color="palette.rose200"
            :decline-color="palette.stone300"
            :button-bg="buttonStyle.bg"
            :button-text="buttonStyle.text"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            :border-radius="rsvpConfig.borderRadius"
            :max-guests="rsvpConfig.maxGuests"
            @submit="onRsvpSubmit"
          />
        </div>
      </section>

    </div>
  </div>

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

    <template v-if="isEditMode" #section-ourStoryList="{ subTab }">
      <template v-if="subTab === 'content'">
        <EditOurStoryModal
          v-if="!editingItem && activeModal === 'ourStoryList'"
          :open="true"
          :items="ourStory.items.value"
          :max-items="3"
          :field-config="OUR_STORY_FIELD_CONFIG['modern-collage']"
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

    <template v-if="isEditMode" #section-collage="{ subTab }">
      <template v-if="subTab === 'content'">
        <EditCollageModal
          :open="true"
          @close="toggleSection('collage')"
          @updated="refreshAllData"
          @files-collected="onCollageFiles"
        />
      </template>
      <SectionLayoutPicker v-if="subTab === 'layout'" :layouts="SECTION_LAYOUTS.collage || []" :current="sectionLayouts.collage" @select="setLayout('collage', $event); markDirty()" />
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="collage" :visible="isSectionVisible('collage')" :anchor-id="sectionAdvancedState.collage?.anchorId || ''" :animation="sectionAdvancedState.collage?.animation || 'none'" :overrides="sectionOverrides.collage || null" @update="onAdvancedUpdate('collage', $event)" />
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
import CountdownTimer from '@/components/invitations/shared/CountdownTimer.vue';
import EventTimeline from '@/components/invitations/shared/EventTimeline.vue';
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
const toast = useToast();

const rootRef = ref(null);
const entryRef = ref(null);
const showAgenda = ref(true);
const showOurStory = ref(true);
const isPrivate = computed(() => route.query.isPrivate === 'true');
const showEntry = ref(true);
const entryType = ref('gallery');
const entryDesign = ref('collage');

// Auto-open entry section when entry overlay is visible in edit mode
watch(showEntry, (visible) => {
  if (!isEditMode.value) return;
  if (visible) {
    toggleSection('entry');
  } else if (activeRootSection.value === 'entry') {
    toggleSection('entry');
  }
}, { immediate: true });

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
        invitationName: 'modern-collage',
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
      invitationName: 'modern-collage',
      lang: locale.value,
    });
    saveThemeToDraft();
    setDraftFullPayload(payload);
    clearDirty();
    router.push({ name: 'signup', params: { lang: locale.value } });
    return;
  }
}

useScrollReveal(rootRef);

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

const DEFAULT_PALETTE = {
  rose200: '#fecdd3',
  stone200: '#e7e5e4',
  stone300: '#d6d3d1',
  accent: '#f43f5e',
  text: '#292524',
  background: '#fafaf9',
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
  { key: 'text', label: t('editSection.textColor') },
  { key: 'background', label: t('editSection.backgroundColor') },
];

const PALETTE_PRESETS = [
  { name: 'Rose', colors: { accent: '#f43f5e', text: '#292524', background: '#fafaf9' } },
  { name: 'Ocean', colors: { accent: '#3b82f6', text: '#1e293b', background: '#f8fafc' } },
  { name: 'Emerald', colors: { accent: '#10b981', text: '#1a2e35', background: '#f0fdf4' } },
  { name: 'Violet', colors: { accent: '#8b5cf6', text: '#1e1b4b', background: '#faf5ff' } },
  { name: 'Amber', colors: { accent: '#f59e0b', text: '#422006', background: '#fffbeb' } },
];

const colorFields = computed(() =>
  COLOR_FIELDS.map(f => ({ ...f, value: palette[f.key] }))
);

const rootStyle = computed(() => ({
  '--font-heading': fonts.heading,
  '--font-body': fonts.body,
  '--theme-accent': palette.accent,
  '--theme-text': palette.text,
  '--theme-bg': palette.background,
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

const config = reactive({
  brideName: 'Sarah',
  groomName: 'James',
  weddingDate: formatWeddingDate(_futureDate),
  weddingDateTime: toLocalISO(_futureDate, '15:00:00'),
  inviteText: t('invitation.gettingMarried'),
  location: 'Napa Valley, CA',
  heroMapUrl: '',
  heroPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80',

  collagePhotos: [
    { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=800&fit=crop', alt: 'Couple' },
    { url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=800&fit=crop', alt: 'Flowers' },
    { url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&h=800&fit=crop', alt: 'Hands' },
    { url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&h=800&fit=crop', alt: 'Rings' },
    { url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&h=800&fit=crop', alt: 'Venue' },
    { url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=800&fit=crop', alt: 'Kiss' },
  ],

  ceremonyVenue: '',
  ceremonyDate: '',
  ceremonyTime: '3:00 PM',
  ceremonyMapUrl: '',
  receptionVenue: '',
  receptionDate: '',
  receptionTime: '5:30 PM - Midnight',
  receptionMapUrl: '',

  agendaEvents: [
    { time: '3:00 PM', title: 'Ceremony Begins', subtitle: 'Please arrive by 2:45 PM', color: palette.rose300 },
    { time: '4:30 PM', title: 'Cocktail Hour', subtitle: "Drinks & Hors d'oeuvres" },
    { time: '6:00 PM', title: 'Dinner Served', subtitle: 'Three-course meal' },
    { time: '8:00 PM', title: 'Dancing', subtitle: "Let's party!" },
    { time: '11:00 PM', title: 'Send Off', subtitle: 'Sparkler exit' },
  ],

  stories: [
    {
      date: 'June 2018',
      title: 'How We Met',
      text: 'It started with a spilled coffee at a local cafe in downtown Seattle. James offered to buy a replacement, and we ended up talking for three hours straight.',
      imageUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=400&fit=crop',
    },
    {
      date: 'July 2018',
      title: 'The First Date',
      text: 'A sunset hike followed by tacos. We realized we shared a love for adventure, spicy food, and terrible 80s music.',
      imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&h=400&fit=crop',
    },
    {
      date: 'December 2023',
      title: 'The Proposal',
      text: 'Under the northern lights in Iceland, James got down on one knee. It was freezing cold, absolutely magical, and the easiest "Yes" ever.',
      imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&h=400&fit=crop',
    },
  ],

  rsvpDeadline: formatRsvpDeadline(_futureDate),
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
  }

  const subtitle = localized(ev.messageI18n, ev.message);
  if (subtitle) config.inviteText = subtitle;

  if (data.location) {
    const loc = data.location;
    const locationStr = [loc.city, loc.country].filter(Boolean).join(', ')
      || loc.venueName || loc.address || '';
    if (locationStr) config.location = locationStr;
    config.heroMapUrl = buildMapUrl(loc);
  }

  // Event Details → ceremony/reception cards
  if (Array.isArray(data.weddingDetails) && data.weddingDetails.length) {
    const sorted = [...data.weddingDetails].sort(
      (a, b) => (EventDetailTypeSortOrder[a.type] || 99) - (EventDetailTypeSortOrder[b.type] || 99)
    );

    const churchItem = sorted.find(d => d.type === 'CHURCH' || d.type === 'REGISTRATION');
    if (churchItem) {
      config.ceremonyVenue = t('detailTypes.' + churchItem.type);
      config.ceremonyDate = churchItem.eventDate || '';
      config.ceremonyTime = churchItem.time || '';
      config.ceremonyMapUrl = buildMapUrl(churchItem.location);
    }

    const receptionItem = sorted.find(d => d.type === 'RECEPTION');
    if (receptionItem) {
      config.receptionVenue = t('detailTypes.' + receptionItem.type);
      config.receptionDate = receptionItem.eventDate || '';
      config.receptionTime = receptionItem.time || '';
      config.receptionMapUrl = buildMapUrl(receptionItem.location);
    }
  }

  // Agenda → timeline events
  if (Array.isArray(data.agenda) && data.agenda.length) {
    const sorted = [...data.agenda].sort((a, b) => parseTimeToMinutes(a.time || a.startTime || '') - parseTimeToMinutes(b.time || b.startTime || ''));
    config.agendaEvents = sorted.map((a) => {
      const typeKey = a.agendaType || a.type || '';
      return {
        time: a.time || a.startTime || '',
        title: typeKey ? t('agenda.types.' + typeKey) : '',
        subtitle: a.description || '',
      };
    });
  }

  if (Array.isArray(data.ourStory) && data.ourStory.length) {
    const ourStoryImages = Array.isArray(data.ourStoryImages) ? data.ourStoryImages : [];
    config.stories = data.ourStory.map((s, i) => ({
      title: s.type ? t('storyTypes.' + s.type) : localized(s.titleI18n, s.title),
      text: localized(s.descriptionI18n, s.description),
      date: s.date || '',
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

    // Hero: use first gallery image if invitation didn't provide one
    if (!config.heroPhotoUrl) {
      config.heroPhotoUrl = imageUrls[0];
    }

    // Collage: use gallery images if invitation/stories didn't populate them
    if (!config.collagePhotos.length) {
      config.collagePhotos = imageUrls.slice(0, 6).map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
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
watch(() => eventDetails.items.value, (items) => {
  if (!items.length) return;
  const sorted = [...items].sort((a, b) => (EventDetailTypeSortOrder[a.type] || 99) - (EventDetailTypeSortOrder[b.type] || 99));
  const churchItem = sorted.find(d => d.type === 'CHURCH' || d.type === 'REGISTRATION');
  if (churchItem) {
    config.ceremonyVenue = t('detailTypes.' + churchItem.type);
    config.ceremonyDate = churchItem.eventDate || '';
    config.ceremonyTime = churchItem.time || '';
    config.ceremonyMapUrl = buildMapUrl(churchItem.location);
  }
  const receptionItem = sorted.find(d => d.type === 'RECEPTION');
  if (receptionItem) {
    config.receptionVenue = t('detailTypes.' + receptionItem.type);
    config.receptionDate = receptionItem.eventDate || '';
    config.receptionTime = receptionItem.time || '';
    config.receptionMapUrl = buildMapUrl(receptionItem.location);
  }
}, { deep: true });

watch(() => agenda.items.value, (items) => {
  if (!items.length) return;
  const sorted = [...items].sort((a, b) => parseTimeToMinutes(a.time || a.startTime || '') - parseTimeToMinutes(b.time || b.startTime || ''));
  config.agendaEvents = sorted.map(a => {
    const typeKey = a.agendaType || a.type || '';
    return {
      time: a.time || a.startTime || '',
      title: typeKey ? t('agenda.types.' + typeKey) : '',
      subtitle: a.description || '',
    };
  });
}, { deep: true });

watch(() => ourStory.items.value, (items) => {
  if (!items.length) return;
  config.stories = items.map(s => ({
    title: s.type ? t('storyTypes.' + s.type) : (s.title || ''),
    text: s.description || '',
    date: s.storyDate || s.date || '',
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
.modern-collage {
  font-family: var(--font-body);
  background: var(--theme-bg);
  color: var(--theme-text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
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
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  inset: 0;
}
.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.9;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}
.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 16px;
  max-width: 900px;
}
.hero-subtitle {
  font-family: var(--font-heading);
  font-size: 20px;
  color: #fff;
  font-style: italic;
  letter-spacing: 1px;
  margin: 0 0 16px;
}
.hero-names {
  font-family: var(--font-heading);
  font-size: 56px;
  color: #fff;
  margin: 0 0 24px;
  line-height: 1.1;
}
.hero-divider {
  width: 96px;
  height: 4px;
  background: #fff;
  margin: 0 auto 32px;
  border-radius: 99px;
}
.hero-details {
  font-family: var(--font-body);
  font-size: 18px;
  color: #f5f5f4;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 40px;
}
.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}
.hero-btn {
  display: inline-block;
  padding: 16px 32px;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s ease;
  min-width: 200px;
  text-align: center;
}
.hero-btn--primary {
  background: #fff;
  color: var(--theme-text);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.hero-btn--primary:hover {
  background: #f5f5f4;
  transform: translateY(-2px);
}
.hero-btn--outline {
  background: transparent;
  color: #fff;
  border: 2px solid #fff;
}
.hero-btn--outline:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}
.hero-scroll-hint {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  animation: bounce-entry 2s ease infinite;
}

@container (min-width: 640px) {
  .hero-names { font-size: 72px; }
  .hero-subtitle { font-size: 24px; }
  .hero-actions { flex-direction: row; justify-content: center; }
}
@container (min-width: 1024px) {
  .hero-names { font-size: 88px; }
}

/* ========== SECTIONS ========== */
.section {
  padding: var(--section-padding, 80px 24px);
}
.section--cream { background: var(--section-bg, #f9fafb); }
.section--white { background: var(--card-bg, #fff); }
.section--dark { background: var(--theme-text); color: #fff; position: relative; overflow: hidden; }
.section-inner { max-width: 1200px; margin: 0 auto; }
.section-inner--narrow { max-width: 700px; }
.section-header { text-align: center; margin-bottom: 64px; }
.section-title {
  font-family: var(--font-heading);
  font-size: 36px;
  font-weight: 400;
  color: var(--theme-text);
  margin: 0 0 16px;
}
.section--dark .section-title { color: #fff; }
.section-subtitle {
  font-family: var(--font-body);
  font-size: 18px;
  color: #78716c;
  margin: 0;
}
.section-divider {
  width: 64px;
  height: 4px;
  background: var(--theme-accent);
  margin: 0 auto;
  border-radius: 99px;
}

@container (min-width: 768px) {
  .section-title { font-size: 42px; }
}

/* ========== COUNTDOWN ========== */
.countdown-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 64px;
}

/* ========== DETAILS ========== */
.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--content-gap, 32px);
  max-width: 900px;
  margin: 0 auto;
}
@container (min-width: 768px) {
  .details-grid { grid-template-columns: 1fr 1fr; }
}

.detail-card {
  background: #fff;
  padding: 40px;
  text-align: center;
  border-radius: 12px;
  box-shadow: 0 4px 20px -2px rgba(150, 140, 130, 0.1);
  transition: box-shadow 0.4s, transform 0.4s;
}
.detail-card:hover {
  box-shadow: 0 10px 25px -5px rgba(150, 140, 130, 0.2);
  transform: translateY(-4px);
}
.detail-card--rose { border-top: 4px solid var(--theme-accent); }
.detail-card--stone { border-top: 4px solid #a8a29e; }

.detail-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.detail-icon svg { width: 24px; height: 24px; }
.detail-icon--rose { background: color-mix(in srgb, var(--theme-accent) 12%, white); color: var(--theme-accent); }
.detail-icon--stone { background: #f5f5f4; color: #57534e; }

.detail-title {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 400;
  color: var(--theme-text);
  margin: 0 0 8px;
}
.detail-time {
  font-size: 16px;
  font-weight: 700;
  color: #78716c;
  margin: 0 0 24px;
}

.detail-time.bold {
  font-weight: 800;
}
.detail-address {
  font-size: 16px;
  color: #57534e;
  line-height: 1.7;
  margin: 0 0 24px;
}
.detail-map-link {
  display: inline-block;
  font-size: 14px;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 2px;
  transition: color 0.2s;
}
.detail-map-link--rose { color: var(--theme-accent); }
.detail-map-link--rose:hover { color: color-mix(in srgb, var(--theme-accent), black 20%); }
.detail-map-link--stone { color: #57534e; }
.detail-map-link--stone:hover { color: var(--theme-text); }

/* ========== STORY ========== */
.story-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--content-gap, 32px);
}
@container (min-width: 768px) {
  .story-grid { grid-template-columns: repeat(3, 1fr); }
}

.story-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px -2px rgba(150, 140, 130, 0.1);
  transition: all 0.4s ease;
}
.story-card:hover {
  box-shadow: 0 10px 25px -5px rgba(150, 140, 130, 0.2);
  transform: translateY(-8px);
}
.story-image {
  height: 256px;
  overflow: hidden;
}
.story-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s ease;
}
.story-card:hover .story-image img {
  transform: scale(1.1);
}
.story-body {
  padding: 24px;
  text-align: center;
}
.story-date {
  display: inline-block;
  padding: 4px 12px;
  background: color-mix(in srgb, var(--theme-accent) 12%, white);
  color: var(--theme-accent);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 999px;
  margin-bottom: 12px;
}
.story-card-title {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 400;
  color: var(--theme-text);
  margin: 0 0 12px;
}
.story-text {
  font-size: 14px;
  color: #57534e;
  line-height: 1.7;
  margin: 0;
}

/* ========== RSVP DARK ========== */
.rsvp-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(96px);
  pointer-events: none;
}
.rsvp-glow--left {
  top: 0; left: 0;
  width: 256px; height: 256px;
  background: rgba(136, 19, 55, 0.2);
  transform: translate(-50%, -50%);
}
.rsvp-glow--right {
  bottom: 0; right: 0;
  width: 384px; height: 384px;
  background: rgba(41, 37, 36, 0.3);
  transform: translate(33%, 33%);
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

/* ========== EDITING HIGHLIGHT ========== */
.section--editing {
  box-shadow: inset 0 0 0 2px #3b82f6;
  position: relative;
  z-index: 1;
}

/* ========== RESPONSIVE ========== */
@container (max-width: 767px) {
  .section { padding: 64px 16px; }
}
</style>

<style>
/* In edit mode, skip scroll-reveal animation — sections always visible */
.inv-layout--split [data-reveal] {
  opacity: 1 !important;
  transform: none !important;
}
</style>
