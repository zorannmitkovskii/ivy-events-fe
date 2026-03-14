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
  <div ref="rootRef" class="persian-wedding" :style="rootStyle">
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
      :photos="config.storyPhotos"
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
      :subtitle="config.subtitle"
      :venue="config.venue"
      :location="config.location"
      :map-url="config.heroMapUrl"
      :photo-url="config.heroPhotoUrl"
      :cta-label="config.ctaLabel"
      :accent-color="palette.accent"
      :gradient-start="palette.background"
      :gradient-mid="palette.gradientMid"
      :gradient-end="palette.gradientEnd"
    />
    </div>

    <!-- Details Section -->
    <section v-show="!showEntry" v-if="isSectionVisible('details')" data-edit-section="details" :class="['section section--white', { 'section--editing': isEditMode && activeRootSection === 'details' }]" data-reveal style="position:relative;">
      <div class="section-inner">
        <h2 class="section-title">{{ t('invitation.weddingDetails') }}</h2>

        <!-- Countdown -->
        <div class="countdown-wrapper">
          <CountdownTimer
            :target-date="config.weddingDateTime"
            label="Countdown to Our Special Day"
            :show-seconds="true"
            :colors="[palette.accent, palette.secondary, palette.tertiary, palette.accentLight]"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            label-color="#555"
            unit-label-color="#666"
          />
        </div>

        <!-- Detail Cards (dynamic from backend) -->
        <div class="details-grid" v-if="config.weddingDetails.length > 0">
          <DetailCard
            v-for="(detail, idx) in config.weddingDetails"
            :key="idx"
            :title="detail.title"
            :accent-color="detailCardPalette[idx % 3].accent"
            :bg-color="detailCardPalette[idx % 3].bg"
            :icon-bg="detailCardPalette[idx % 3].iconBg"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            :shadow="shadows.card"
            :hover-shadow="shadows.cardHover"
            border-width="0"
            border-radius="16px"
          >
            <template #icon>
              <span class="card-emoji">{{ iconMap[detail.icon] || typeToIcon[detail.icon] || '📋' }}</span>
            </template>
            <p v-if="detail.eventDate" class="bold">{{ detail.eventDate }}</p>
            <p v-if="detail.time">{{ detail.time }}</p>
            <template #footer>
              <a v-if="detail.mapUrl" :href="detail.mapUrl" target="_blank" rel="noopener" class="map-btn" :style="{ background: detailCardPalette[idx % 3].accent }">{{ t('invitation.viewMap') }}</a>
            </template>
          </DetailCard>
        </div>

        <!-- Detail Cards (hardcoded fallback for preview mode) -->
        <div class="details-grid" v-else>
          <DetailCard
            :title="t('invitation.ceremony')"
            :accent-color="palette.accent"
            :bg-color="palette.accentBg"
            :icon-bg="palette.accentIcon"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            :shadow="shadows.card"
            :hover-shadow="shadows.cardHover"
            border-width="0"
            border-radius="16px"
          >
            <template #icon>
              <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </template>
            <p class="bold">{{ config.ceremonyDate }}</p>
            <p>{{ config.ceremonyTime }}</p>
            <template #footer>
              <a v-if="config.ceremonyMapUrl" :href="config.ceremonyMapUrl" target="_blank" rel="noopener" class="map-btn" :style="{ background: palette.accent }">{{ t('invitation.viewMap') }}</a>
            </template>
          </DetailCard>

          <DetailCard
            :title="t('invitation.reception')"
            :accent-color="palette.secondary"
            :bg-color="palette.secondaryBg"
            :icon-bg="palette.secondaryIcon"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            :shadow="shadows.card"
            :hover-shadow="shadows.cardHover"
            border-width="0"
            border-radius="16px"
          >
            <template #icon>
              <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </template>
            <p class="bold">{{ config.receptionDate }}</p>
            <p>{{ config.receptionTime }}</p>
            <template #footer>
              <a v-if="config.receptionMapUrl" :href="config.receptionMapUrl" target="_blank" rel="noopener" class="map-btn" :style="{ background: palette.secondary }">{{ t('invitation.viewMap') }}</a>
            </template>
          </DetailCard>

          <DetailCard
            :title="t('invitation.venue')"
            :accent-color="palette.tertiary"
            :bg-color="palette.tertiaryBg"
            :icon-bg="palette.tertiaryIcon"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            :shadow="shadows.card"
            :hover-shadow="shadows.cardHover"
            border-width="0"
            border-radius="16px"
          >
            <template #icon>
              <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </template>
            <p class="bold">{{ config.venueName }}</p>
            <p>{{ config.venueAddress }}</p>
            <template #footer>
              <a v-if="config.venueMapUrl" :href="config.venueMapUrl" target="_blank" rel="noopener" class="map-btn" :style="{ background: palette.tertiary }">{{ t('invitation.viewMap') }}</a>
            </template>
          </DetailCard>
        </div>
      </div>
    </section>

    <!-- Agenda Timeline -->
    <section v-if="(isEditMode || (showAgenda && !isPrivate)) && isSectionVisible('agendaList')" v-show="!showEntry" data-edit-section="agendaList" :class="['section section--gradient', { 'section--editing': isEditMode && activeRootSection === 'agendaList' }]" data-reveal style="position:relative;">
      <div class="section-inner section-inner--narrow">
        <VerticalTimeline
          :title="t('invitation.weddingDayTimeline')"
          :events="config.agendaEvents"
          :pill-colors="[palette.accent, palette.secondary, palette.tertiary]"
          :card-shadow="shadows.card"
          card-radius="16px"
          :heading-font="fonts.heading"
          :body-font="fonts.body"
        />
      </div>
    </section>

    <!-- Our Story -->
    <section v-if="(isEditMode || showOurStory) && isSectionVisible('ourStoryList')" v-show="!showEntry" data-edit-section="ourStoryList" :class="['section section--white', { 'section--editing': isEditMode && activeRootSection === 'ourStoryList' }]" data-reveal style="position:relative;">
      <div class="section-inner">
        <OurStorySection
          :title="t('invitation.ourLoveStory')"
          :stories="config.stories"
          :photos="config.storyPhotos"
          :card-colors="[palette.accentBg, palette.secondaryBg]"
          :card-shadow="shadows.card"
          card-radius="16px"
          :heading-font="fonts.heading"
          :body-font="fonts.body"
        />
      </div>
    </section>

    <!-- RSVP -->
    <section v-show="!showEntry" v-if="isSectionVisible('rsvp')" id="rsvp-section" data-edit-section="rsvp" :class="['section section--gradient', { 'section--editing': isEditMode && activeRootSection === 'rsvp' }]" data-reveal>
      <div class="section-inner section-inner--narrow">
        <h2 class="section-title">{{ t('invitation.rsvp') }}</h2>
        <p class="section-sub">{{ t('invitation.rsvpSubtitle', { date: config.rsvpDeadline }) }}</p>

        <div class="rsvp-wrapper">
          <RsvpForm
            title=""
            :accent-color="palette.accent"
            :accept-color="palette.tertiary"
            :decline-color="palette.accentLight"
            :button-bg="buttonStyle.bg"
            :button-text="buttonStyle.text"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            :border-radius="rsvpConfig.borderRadius"
            :max-guests="rsvpConfig.maxGuests"
            :name-label="t('invitation.fullName')"
            :name-placeholder="t('invitation.namePlaceholder')"
            :add-guest-label="t('invitation.addGuestShort')"
            :accept-label="t('invitation.joyfullyAccept')"
            :decline-label="t('invitation.regretfullyDecline')"
            :message-label="t('invitation.specialMessage')"
            :message-placeholder="t('invitation.messagePlaceholder')"
            :submit-label="t('invitation.submitRsvp')"
            @submit="onRsvpSubmit"
          />
        </div>
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
          :field-config="OUR_STORY_FIELD_CONFIG['persian-wedding']"
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
import HeroSection from '@/components/invitations/wedding/PersianWedding/HeroSection.vue';
import OurStorySection from '@/components/invitations/wedding/PersianWedding/OurStorySection.vue';
import DetailCard from '@/components/invitations/shared/DetailCard.vue';
import CountdownTimer from '@/components/invitations/shared/CountdownTimer.vue';
import VerticalTimeline from '@/components/invitations/shared/VerticalTimeline.vue';
import RsvpForm from '@/components/invitations/shared/RsvpForm.vue';
import InvitationEntry from '@/components/invitations/entries/InvitationEntry.vue';
import EditEntryModal from '@/components/modals/EditEntryModal.vue';
import EditColorsModal from '@/components/modals/EditColorsModal.vue';
import EditFontsModal from '@/components/modals/EditFontsModal.vue';
import { useInvitationEditMode } from '@/composables/useInvitationEditMode';
import { useToast } from '@/composables/useToast';
import { useSectionState } from '@/composables/useSectionState';
import { getDraftTheme, setDraftTheme, getDraftSectionState, setDraftSectionState, setDraftFullPayload } from '@/store/invitationDraft.store';
import SectionLayoutPicker from '@/components/invitations/shared/SectionLayoutPicker.vue';
import SectionAdvanced from '@/components/invitations/shared/SectionAdvanced.vue';
import { isAuthenticated } from '@/services/auth.service';
import AddAgendaItemModal from '@/components/modals/AddAgendaItemModal.vue';
import AddOurStoryModal from '@/components/modals/AddOurStoryModal.vue';
import OurStoryUploadModal from '@/components/modals/OurStoryUploadModal.vue';
import EditCollageModal from '@/components/modals/EditCollageModal.vue';
import EditOurStoryModal from '@/components/modals/EditOurStoryModal.vue';
import { OUR_STORY_FIELD_CONFIG } from '@/config/ourStoryFieldConfig.js';
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
const showEntry = ref(true);
const showAgenda = ref(true);
const showOurStory = ref(true);
const isPrivate = computed(() => route.query.isPrivate === 'true');
const entryType = ref('heart');
const entryDesign = ref('bloom');

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
      config.venueMapUrl = mapUrl;
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
        invitationName: 'persian-wedding',
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
      invitationName: 'persian-wedding',
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

const DEFAULT_PALETTE = {
  accent: '#F9A8D4',
  accentLight: '#FBCFE8',
  accentBg: '#FFF1F2',
  accentIcon: '#FBCFE8',
  secondary: '#C4B5FD',
  secondaryBg: '#F5F3FF',
  secondaryIcon: '#DDD6FE',
  tertiary: '#6EE7B7',
  tertiaryBg: '#F0FDFA',
  tertiaryIcon: '#A7F3D0',
  background: '#FFE5EC',
  gradientMid: '#E5D4ED',
  gradientEnd: '#D4F1E8',
};

const DEFAULT_FONTS = {
  heading: "'Playfair Display', serif",
  body: "'Lato', sans-serif",
};

const palette = reactive({ ...DEFAULT_PALETTE });
const fonts = reactive({ ...DEFAULT_FONTS });

const COLOR_FIELDS = [
  { key: 'accent', label: t('editSection.accentColor') },
  { key: 'secondary', label: t('editSection.secondaryColor') },
  { key: 'tertiary', label: t('editSection.tertiaryColor') },
  { key: 'background', label: t('editSection.backgroundColor') },
];

const PALETTE_PRESETS = [
  { name: 'Bloom', colors: { accent: '#F9A8D4', secondary: '#C4B5FD', tertiary: '#6EE7B7', background: '#FFE5EC' } },
  { name: 'Sunset', colors: { accent: '#FCA5A5', secondary: '#FCD34D', tertiary: '#86EFAC', background: '#FFF7ED' } },
  { name: 'Sky', colors: { accent: '#93C5FD', secondary: '#A5B4FC', tertiary: '#6EE7B7', background: '#EFF6FF' } },
  { name: 'Royal', colors: { accent: '#D8B4FE', secondary: '#F9A8D4', tertiary: '#67E8F9', background: '#F5F3FF' } },
  { name: 'Tropical', colors: { accent: '#F0ABFC', secondary: '#FDE68A', tertiary: '#34D399', background: '#FDF4FF' } },
];

const SHADOW_MAP = {
  none: 'none',
  subtle: '0px 4px 20px rgba(200, 180, 220, 0.15)',
  medium: '0px 6px 24px rgba(200, 180, 220, 0.25)',
  strong: '0px 10px 40px rgba(200, 180, 220, 0.35)',
};

const SPACING_MAP = {
  compact: { section: '48px 16px', gap: '24px', cardPadding: '20px' },
  balanced: { section: '80px 24px', gap: '32px', cardPadding: '32px' },
  spacious: { section: '120px 32px', gap: '48px', cardPadding: '40px' },
};

const buttonStyle = reactive({ bg: '#F9A8D4', text: '#ffffff', radius: '8px' });
const cardStyle = reactive({
  sectionBg: '#fff', cardBg: '#ffffff',
  cardShadow: 'subtle', cardRadius: '16px', cardBorder: '0px',
});
const spacingPreset = ref('balanced');
const rsvpConfig = reactive({
  deadline: '', maxGuests: 5, showDietary: true, borderRadius: '8px',
});

const shadows = computed(() => ({
  card: SHADOW_MAP[cardStyle.cardShadow],
  cardHover: cardStyle.cardShadow === 'none' ? 'none' : SHADOW_MAP.medium,
}));

const colorFields = computed(() =>
  COLOR_FIELDS.map(f => ({ ...f, value: palette[f.key] }))
);

const rootStyle = computed(() => ({
  '--font-heading': fonts.heading,
  '--font-body': fonts.body,
  '--theme-accent': palette.accent,
  '--theme-secondary': palette.secondary,
  '--theme-tertiary': palette.tertiary,
  '--theme-bg': palette.background,
  '--theme-gradient-mid': palette.gradientMid,
  '--theme-gradient-end': palette.gradientEnd,
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
  brideName: 'Emily',
  groomName: 'James',
  weddingDate: formatWeddingDate(_futureDate),
  weddingDateTime: toLocalISO(_futureDate, '16:00:00'),
  subtitle: t('invitation.weAreGettingMarried'),
  venue: 'Sunset Garden Estate',
  location: 'Santa Barbara, California',
  ctaLabel: 'RSVP Now',
  heroPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1000&fit=crop',
  heroMapUrl: '',

  ceremonyDate: formatWeddingDate(_futureDate),
  ceremonyTime: '4:00 PM',
  ceremonyMapUrl: '',
  receptionDate: formatWeddingDate(_futureDate),
  receptionTime: '6:00 PM',
  receptionMapUrl: '',
  venueName: 'Sunset Garden Estate',
  venueAddress: 'Santa Barbara, CA',
  venueMapUrl: '',

  weddingDetails: [],

  agendaEvents: [
    { time: '3:30 PM', title: 'Guest Arrival', subtitle: 'Guests arrive and are seated in the garden ceremony area.' },
    { time: '4:00 PM', title: 'Ceremony Begins', subtitle: 'The wedding ceremony starts with the processional.' },
    { time: '4:45 PM', title: 'Cocktail Hour', subtitle: "Enjoy drinks and hors d'oeuvres on the terrace." },
    { time: '6:00 PM', title: 'Reception & Dinner', subtitle: 'Dinner service begins with toasts and speeches.' },
    { time: '8:00 PM', title: 'First Dance', subtitle: 'The newlyweds share their first dance.' },
    { time: '8:30 PM', title: 'Dancing & Celebration', subtitle: 'Dance the night away with live music and DJ.' },
  ],

  storyTitle: 'Our Love Story',
  stories: [
    {
      title: 'How We Met',
      text: "We met at a coffee shop in downtown Santa Barbara on a rainy afternoon in 2019. James accidentally spilled his latte on Emily's laptop, and the rest is history. What started as an awkward apology turned into hours of conversation.",
    },
    {
      title: 'The Proposal',
      text: 'On a sunset hike at our favorite trail, James got down on one knee overlooking the ocean. With tears in his eyes, he asked Emily to spend forever with him. She said yes before he could even finish the question!',
    },
  ],
  storyPhotos: [
    { url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=500&fit=crop', alt: 'Our Story 1' },
    { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=500&fit=crop', alt: 'Our Story 2' },
    { url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=500&fit=crop', alt: 'Our Story 3' },
    { url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&h=500&fit=crop', alt: 'Our Story 4' },
  ],

  rsvpDeadline: formatRsvpDeadline(_futureDate),
});

const detailCardPalette = computed(() => [
  { accent: palette.accent, bg: palette.accentBg, iconBg: palette.accentIcon },
  { accent: palette.secondary, bg: palette.secondaryBg, iconBg: palette.secondaryIcon },
  { accent: palette.tertiary, bg: palette.tertiaryBg, iconBg: palette.tertiaryIcon },
]);

const iconMap = {
  church: '⛪', party: '🎉', dresscode: '👔', rings: '💍',
  cake: '🎂', music: '🎵', gift: '🎁', hotel: '🏨',
  transport: '🚗', food: '🍽️', photo: '📷', flowers: '💐',
};

const typeToIcon = {
  CEREMONY: '⛪', CHURCH: '⛪', RECEPTION: '🎉',
  COCKTAIL: '🍸', DINNER: '🍽️', DANCE: '🎵',
  BRUNCH: '☕', WELCOME: '🥂',
};

/* ---- fetch & apply ---- */
const backendData = ref(null);

async function refreshAllData() {
  const data = await fetchData();
  if (data) {
    backendData.value = data;
    const defaultHero = config.heroPhotoUrl;
    const defaultPhotos = [...config.storyPhotos];
    config.heroPhotoUrl = '';
    config.storyPhotos = [];
    applyBackendData(data);
    await loadGalleryImages();
    if (!config.heroPhotoUrl) config.heroPhotoUrl = defaultHero;
    if (!config.storyPhotos.length) config.storyPhotos = defaultPhotos;
  }
}

refreshCallback.value = refreshAllData;

// Sync composable items → config so preview updates after CRUD
watch(() => eventDetails.items.value, (items) => {
  if (!items.length) return;
  const sorted = [...items].sort(
    (a, b) => (EventDetailTypeSortOrder[a.type] || 99) - (EventDetailTypeSortOrder[b.type] || 99)
  );
  config.weddingDetails = sorted.map(d => ({
    title: t('detailTypes.' + d.type),
    eventDate: d.eventDate || '',
    time: d.time || '',
    icon: d.type || null,
    mapUrl: buildMapUrl(d.location),
  }));
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
  }));
  const imgItems = items.filter(s => s.imageUrl);
  if (imgItems.length) {
    config.storyPhotos = imgItems.map((s, i) => ({ url: s.imageUrl, alt: 'Our Story ' + (i + 1) }));
  }
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

  // Couple names
  if (ev.coupleNames?.bride) config.brideName = ev.coupleNames.bride;
  if (ev.coupleNames?.groom) config.groomName = ev.coupleNames.groom;

  // Hero image
  if (ev.heroImageUrl) config.heroPhotoUrl = ev.heroImageUrl;

  // Date
  if (ev.date) {
    config.weddingDateTime = ev.date;
    config.weddingDate = formatDate(ev.date);
  }

  // Subtitle
  const subtitle = localized(ev.messageI18n, ev.message);
  if (subtitle) config.subtitle = subtitle;

  // Location
  if (data.location) {
    const loc = data.location;
    if (loc.venueName) {
      config.venue = loc.venueName;
      config.venueName = loc.venueName;
    }
    const addressStr = [loc.city, loc.country].filter(Boolean).join(', ') || loc.address || '';
    if (addressStr) {
      config.location = addressStr;
      config.venueAddress = addressStr;
    }
    const mapUrl = buildMapUrl(loc);
    if (mapUrl) {
      config.venueMapUrl = mapUrl;
      config.heroMapUrl = mapUrl;
    }
  }

  // Event Details → dynamic detail cards
  if (Array.isArray(data.weddingDetails) && data.weddingDetails.length) {
    const sorted = [...data.weddingDetails].sort(
      (a, b) => (EventDetailTypeSortOrder[a.type] || 99) - (EventDetailTypeSortOrder[b.type] || 99)
    );

    config.weddingDetails = sorted.map((d) => ({
      title: t('detailTypes.' + d.type),
      eventDate: d.eventDate || '',
      time: d.time || '',
      icon: d.type || null,
      mapUrl: buildMapUrl(d.location),
    }));
  }

  // Agenda → timeline events
  if (Array.isArray(data.agenda) && data.agenda.length) {
    const sorted = [...data.agenda].sort((a, b) => parseTimeToMinutes(a.time || a.startTime || '') - parseTimeToMinutes(b.time || b.startTime || ''));
    config.agendaEvents = sorted.map((a) => {
      const typeKey = a.agendaType || a.type || '';
      return {
        time: a.time || a.startTime || formatTime(a.date),
        title: typeKey ? t('agenda.types.' + typeKey) : '',
        subtitle: a.description || '',
      };
    });
  }

  // Our Story
  if (Array.isArray(data.ourStory) && data.ourStory.length) {
    config.stories = data.ourStory.map((s) => ({
      title: s.type ? t('storyTypes.' + s.type) : localized(s.titleI18n, s.title),
      text: localized(s.descriptionI18n, s.description),
    }));
    const imgSources = Array.isArray(data.ourStoryImages) && data.ourStoryImages.length
      ? data.ourStoryImages
      : data.ourStory.filter((s) => s.imageUrl).map((s) => s.imageUrl);
    if (imgSources.length) {
      config.storyPhotos = imgSources.map((url, i) => ({
        url,
        alt: 'Our Story ' + (i + 1),
      }));
    }
  }

  // RSVP deadline
  if (ev.rsvpDeadline) {
    config.rsvpDeadline = formatDate(ev.rsvpDeadline);
  } else if (ev.date) {
    const d = new Date(ev.date); d.setDate(d.getDate() - 14);
    config.rsvpDeadline = formatDate(d.toISOString());
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

    if (!config.storyPhotos.length) {
      config.storyPhotos = imageUrls.slice(0, 4).map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
    }
  } catch (e) {
    console.error('Gallery fetch failed:', e);
  }
}

onMounted(async () => {
  const fontLinks = [
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap',
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
.persian-wedding {
  font-family: var(--font-body);
  background: #fff;
  color: #555;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  container-type: inline-size;
}

/* Sections */
.section {
  padding: var(--section-padding, 80px 24px);
}

.section--white {
  background: var(--card-bg, #fff);
}

.section--gradient {
  background: linear-gradient(135deg, var(--theme-bg) 0%, var(--theme-gradient-mid) 50%, var(--theme-gradient-end) 100%);
}

.section--editing {
  box-shadow: inset 0 0 0 2px #3b82f6;
  position: relative;
  z-index: 1;
}

.section-inner {
  max-width: 1100px;
  margin: 0 auto;
}

.section-inner--narrow {
  max-width: 800px;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 40px;
  font-weight: 500;
  color: #333;
  text-align: center;
  margin: 0 0 12px;
}

.section-sub {
  font-family: var(--font-body);
  font-size: 16px;
  color: #666;
  text-align: center;
  margin: 0 0 48px;
}

/* Countdown wrapper */
.countdown-wrapper {
  background: linear-gradient(135deg, var(--theme-bg) 0%, var(--theme-gradient-mid) 50%, var(--theme-gradient-end) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--card-radius, 16px);
  box-shadow: var(--card-shadow, 0px 4px 20px rgba(200, 180, 220, 0.15));
  padding: var(--card-padding, 40px);
  margin-bottom: 48px;
}

/* Loading overlay */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--theme-bg) 0%, var(--theme-gradient-mid) 50%, var(--theme-gradient-end) 100%);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(200, 180, 220, 0.3);
  border-top-color: var(--theme-secondary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Details grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--content-gap, 24px);
}

/* Bold text in detail cards */
:deep(.bold) {
  font-weight: 700;
}

/* SVG icons in detail cards */
:deep(.card-svg) {
  width: 32px;
  height: 32px;
}

:deep(.card-emoji) {
  font-size: 28px;
  line-height: 1;
}

/* Map buttons in detail card footers */
:deep(.map-btn) {
  display: inline-block;
  color: var(--btn-text, #fff);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 24px;
  border-radius: var(--btn-radius, 8px);
  text-decoration: none;
  transition: all 0.3s ease;
}

:deep(.map-btn:hover) {
  opacity: 0.85;
  transform: translateY(-1px);
}

/* RSVP wrapper */
.rsvp-wrapper {
  background: var(--card-bg, #fff);
  border-radius: var(--card-radius, 16px);
  box-shadow: var(--card-shadow, 0px 4px 20px rgba(200, 180, 220, 0.15));
  padding: var(--card-padding, 40px) 48px;
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

/* Responsive */
@container (max-width: 768px) {
  .section {
    padding: 56px 16px;
  }

  .details-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }

  .section-title {
    font-size: 32px;
  }

  .countdown-wrapper {
    padding: 24px;
  }

  .rsvp-wrapper {
    padding: 24px;
  }
}

@container (max-width: 480px) {
  .rsvp-wrapper {
    padding: 20px 16px;
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
