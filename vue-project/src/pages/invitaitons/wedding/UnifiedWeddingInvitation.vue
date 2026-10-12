<template>
  <InvitationEditLayout
    ref="editLayoutRef"
    :edit-mode="isEditMode"
    :sections="orderedSections"
    :active-section="activeRootSection"
    :dirty="dirty"
    :preview-mode="previewMode"
    :statuses="sectionStatuses"
    :section-visibility="sectionVisibility"
    :show-layout-tab="isBuilder"
    :save-status="saveStatus"
    :save-status-detail="saveStatusDetail"
    :last-synced-at="lastSyncedAt"
    :save-enabled="isNewUnsaved"
    :info-focus="infoFocus"
    :guest-device="isGuestPreview ? previewDevice : null"
    :history="isEditMode ? historyState : null"
    @undo="undoEdit"
    @redo="redoEdit"
    @preview-guest="openGuestPreview"
    @retry-save="retrySave"
    @toggle-section="toggleSection"
    @toggle-visibility="(k) => { toggleVisibility(k); markDirty(); }"
    @save="onGlobalSave"
    @set-preview="previewMode = $event"
    @select-section="selectSection"
  >
  <!-- INV-602: the final preview as a guest — its bar, above the invitation -->
  <template v-if="isGuestPreview" #toolbar>
    <GuestPreviewBar
      :notes="previewNotes"
      :device="previewDevice"
      :private-link="isPrivate"
      :timezone="config.eventTimezone"
      @back="backToEditor"
      @set-device="previewDevice = $event"
      @set-private="setPreviewPrivate"
      @note-action="editFromPreview"
    >
      <template v-if="showStepper" #steps>
        <CreationStepper :steps="creationSteps" @go="goToStep" />
      </template>
    </GuestPreviewBar>
  </template>
  <!-- INV-104: what happened to the draft -->
  <DraftNotice
    :failed="resumeMode === 'failed'"
    :photos="isEditMode ? photosToReAdd : 0"
    :busy="saveStatus === 'saving'"
    :editor="isEditMode"
    @retry="saveDraftAsNewEvent"
    @dismiss-photos="dismissPhotosNotice"
  />
  <InvitationAuthDialog
    :open="authGateOpen || resumeMode === 'choose'"
    :mode="authGateOpen ? 'gate' : 'choose'"
    :photo-count="authGateOpen ? unsavedPhotoCount : photosToReAdd"
    :busy="saveStatus === 'saving'"
    :conflict="resumeConflict"
    @signup="continueToAuth('signup')"
    @login="continueToAuth('login')"
    @cancel="authGateOpen ? closeAuthGate() : keepDraftForLater()"
    @save-new="saveDraftAsNewEvent"
    @discard="discardDraft"
  />
  <!-- INV-502: the one "unsaved changes" question when the editor is left -->
  <UnsavedChangesDialog
    :open="leavePrompt.open"
    :kind="leavePrompt.kind"
    :busy="leavePrompt.busy"
    :failed="leavePrompt.failed"
    @save="saveAndLeave"
    @discard="discardAndLeave"
    @stay="stayInEditor"
  />

  <div ref="rootRef" class="unified-invitation" :class="[preset.id, { 'edit-active': isEditMode }]" :style="rootStyle">
    <!-- INV-202: inside the catalogue's preview — says what is only an example -->
    <p v-if="isEmbedPreview" class="sample-preview-badge" data-testid="sample-preview-badge">
      {{ t('editSection.samplePreview.badge') }}
    </p>

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
      @edit="editLayoutRef?.requestSection('entry')"
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
    <!-- INV-402: an empty programme is left out for guests; the editor says it is empty. -->
    <section v-if="(isEditMode || (showAgenda && isPrivate && sectionHasContent.agendaList)) && isSectionVisible('agendaList')" v-show="!entryActive" data-edit-section="agendaList" :class="['section section--base', { 'section--editing': isEditMode && activeRootSection === 'agendaList' }]" data-reveal style="position:relative;">
      <SectionEditButton :visible="isEditMode" :label="t('editSection.agenda')" @click="selectSection('agendaList')" />
      <div class="section-inner">
        <p v-if="!sectionHasContent.agendaList" class="section-empty-hint" data-testid="preview-empty-hint">{{ t('editSection.sectionStates.previewEmpty') }}</p>
        <component
          v-else-if="scheduleComponent"
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
    <section v-if="(isEditMode || (showOurStory && sectionHasContent.ourStoryList)) && isSectionVisible('ourStoryList')" v-show="!entryActive" data-edit-section="ourStoryList" :class="['section section--alt', { 'section--editing': isEditMode && activeRootSection === 'ourStoryList' }]" data-reveal style="position:relative;">
      <SectionEditButton :visible="isEditMode" :label="t('editSection.ourStory')" @click="selectSection('ourStoryList')" />
      <div class="section-inner">
        <p v-if="!sectionHasContent.ourStoryList" class="section-empty-hint" data-testid="preview-empty-hint">{{ t('editSection.sectionStates.previewEmpty') }}</p>
        <component
          v-else-if="storyComponent"
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
          <p v-if="isEmbedPreview" class="sample-preview-rsvp" data-testid="sample-preview-rsvp">
            {{ t('editSection.samplePreview.rsvpNote') }}
          </p>
          <!-- INV-602: the form as guests get it — a reply here is never sent -->
          <p v-else-if="isGuestPreview" class="sample-preview-rsvp" data-testid="guest-preview-rsvp">
            {{ t('editSection.guestPreview.rsvpNote') }}
          </p>
          <RsvpForm
            title=""
            :name-label="t('invitation.fullName')"
            :name-placeholder="t('invitation.namePlaceholder')"
            :add-guest-label="t('invitation.addGuest')"
            :child-label="t('invitation.child')"
            :attendance-label="t('invitation.willYouAttend')"
            :accept-label="t('invitation.joyfullyAccept')"
            :decline-label="t('invitation.regretfullyDecline')"
            :message-label="t('invitation.yourMessage')"
            :message-placeholder="t('invitation.messagePlaceholder')"
            :submit-label="t('invitation.sendRsvp')"
            :submitting-label="t('invitation.sending')"
            :accent-color="palette.accent"
            :accept-color="palette.accent"
            :decline-color="palette.secondary"
            :button-bg="buttonStyle.bg"
            :button-text="buttonStyle.text"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            :border-radius="rsvpConfig.borderRadius"
            :max-guests="rsvpConfig.maxGuests"
            :event-inactive="eventNotActive"
            :send="isEmbedPreview || isGuestPreview ? sendSampleRsvp : onRsvpSubmit"
          />
        </div>
      </div>
    </section>

    </div>
  </div>

    <!-- Steps of a new invitation (INV-102) -->
    <template v-if="isEditMode && showStepper" #stepper>
      <CreationStepper :steps="creationSteps" @go="goToStep" />
    </template>

    <!-- Info Panel -->
    <template v-if="isEditMode" #info-panel>
      <!-- INV-203: another design, the same content -->
      <DesignSwitcher
        :current-id="designId"
        :current-name="currentDesignName"
        :designs="switchDesigns"
        :loading="designsLoading"
        :error="designsError"
        :busy="designSwitching"
        :hidden="hiddenContent"
        :confirm-leaving="isBuilder"
        :existing-event="!isNewUnsaved"
        :announcement="designAnnouncement"
        @open="onDesignSwitchOpen"
        @retry="loadDesigns"
        @switch="switchDesign"
      />
      <!-- INV-403: the event could not be read — its names, date and place are
           not offered for editing (the design's demo would be saved over them). -->
      <SectionStateNotice
        v-if="eventLoad === 'failed'"
        kind="event"
        state="failed"
        :busy="saveStatus === 'saving'"
        @retry="retrySave"
      />
      <EditInfoPanel
        v-else
        :bride-name="config.brideName"
        :groom-name="config.groomName"
        :wedding-date="config.weddingDateTime ? config.weddingDateTime.slice(0, 10) : ''"
        :wedding-time="weddingTimeValue"
        :timezone="config.eventTimezone"
        :title-mode="titleMode"
        :location="backendData?.event?.location || (config.venue ? { name: config.venue, address: config.location, lat: config.locationLat ?? null, lng: config.locationLng ?? null } : null)"
        :invalid-fields="showStepper ? infoInvalidFields : []"
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
      <!-- INV-403: the hero photo with what it is in (saved / uploading / not saved). -->
      <div v-if="subTab === 'content'" class="story-images-panel" data-testid="photo-panel-hero">
        <SectionStateNotice v-if="eventLoad === 'failed'" kind="event" state="failed" :busy="saveStatus === 'saving'" @retry="retrySave" />
        <template v-else>
          <PhotoSlot
            wide
            :photo="photoSlot('hero', 0)"
            :label="t('editSection.photos.hero')"
            :placeholder="t('editSection.photos.choose')"
            :removable-saved="false"
            @pick="pickPhoto('hero', 0, $event)"
            @remove="removePhoto('hero', 0)"
            @retry="retrySave"
            @broken="brokenPhoto('hero', 0)"
          />
          <p class="photo-limits">{{ t('editSection.photos.limits') }}</p>
        </template>
      </div>
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
          :hidden="!isSectionVisible('details')"
          :load-state="sectionLoad.eventDetails"
          :busy="saveStatus === 'saving'"
          @close="toggleSection('details')"
          @add="onDetailsAdd"
          @delete="onDetailsDelete"
          @update="handleEventDetailUpdate"
          @skip="setSectionShown('details', false)"
          @show="setSectionShown('details', true)"
          @retry-load="retrySave"
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
      <div v-if="subTab === 'layout'" class="family-picker-wrap">
        <p class="family-picker-label">Details Style</p>
        <SectionLayoutPicker :layouts="DETAILS_FAMILY_OPTIONS" :current="detailsFamily" @select="onDetailsFamilyChange($event)" />
      </div>
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="details" :visible="isSectionVisible('details')" :anchor-id="sectionAdvancedState.details?.anchorId || ''" :animation="sectionAdvancedState.details?.animation || 'none'" :overrides="sectionOverrides.details || null" @update="onAdvancedUpdate('details', $event)" />
    </template>

    <!-- Agenda -->
    <template v-if="isEditMode" #section-agendaList="{ subTab }">
      <template v-if="subTab === 'content'">
        <EditAgendaModal
          v-if="!editingItem && activeModal === 'agendaList'"
          :open="true"
          :items="agenda.items.value"
          :hidden="!isSectionVisible('agendaList')"
          :load-state="sectionLoad.agenda"
          :busy="saveStatus === 'saving'"
          @close="toggleSection('agendaList')"
          @add="onAgendaAdd"
          @delete="onAgendaDelete"
          @update="handleAgendaUpdate"
          @skip="setSectionShown('agendaList', false)"
          @show="setSectionShown('agendaList', true)"
          @retry-load="retrySave"
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
          :max-items="storyMaxItems"
          :hidden="!isSectionVisible('ourStoryList')"
          :load-state="sectionLoad.ourStory"
          :busy="saveStatus === 'saving'"
          @close="toggleSection('ourStoryList')"
          @add="onOurStoryAdd"
          @delete="onOurStoryDelete"
          @update="handleOurStoryUpdate"
          @skip="setSectionShown('ourStoryList', false)"
          @show="setSectionShown('ourStoryList', true)"
          @retry-load="retrySave"
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
      <div v-if="storyFamily !== 'coastal'" class="story-images-panel" data-testid="photo-panel-story">
        <!-- INV-403: the story photos come with the story; unread, they are not offered. -->
        <SectionStateNotice
          v-if="sectionLoad.ourStory === 'failed' || sectionLoad.ourStory === 'loading'"
          kind="story"
          :state="sectionLoad.ourStory"
          :busy="saveStatus === 'saving'"
          @retry="retrySave"
        />
        <template v-else>
          <p class="photo-limits" data-testid="photo-limits">{{ t('editSection.photos.limits') }}</p>
          <!-- Single image for Parisian: the first story photo -->
          <div v-if="storyFamily === 'parisian'" class="story-image-upload">
            <PhotoSlot
              wide
              :photo="photoSlot('story', 0)"
              :label="t('editSection.photos.storySingle')"
              :placeholder="t('editSection.photos.choose')"
              @pick="pickPhoto('story', 0, $event)"
              @remove="removePhoto('story', 0)"
              @restore="restorePhoto('story', 0)"
              @retry="retrySave"
              @broken="brokenPhoto('story', 0)"
            />
          </div>

          <!-- Multi-image grid — always shows all slots -->
          <template v-else>
            <div class="story-images-header-row">
              <span class="story-image-label">{{ t('editOurStory.photos') }}</span>
            </div>
            <div class="story-images-grid-edit">
              <PhotoSlot
                v-for="idx in storyImageMax"
                :key="'slot-' + idx"
                :photo="photoSlot('story', idx - 1)"
                :label="t('editSection.photos.storySlot', { n: idx })"
                :placeholder="String(idx)"
                @pick="pickPhoto('story', idx - 1, $event)"
                @remove="removePhoto('story', idx - 1)"
                @restore="restorePhoto('story', idx - 1)"
                @retry="retrySave"
                @broken="brokenPhoto('story', idx - 1)"
              />
            </div>
          </template>
        </template>
      </div>
    </template>

    <!-- Collage (shown when gallery entry selected) -->
    <template v-if="isEditMode" #section-collage>
      <div class="story-images-panel" data-testid="photo-panel-collage">
        <SectionStateNotice v-if="eventLoad === 'failed'" kind="event" state="failed" :busy="saveStatus === 'saving'" @retry="retrySave" />
        <template v-else>
          <div class="story-images-header-row">
            <span class="story-image-label">{{ t('editSection.collage') }} ({{ collageOwnCount }}/{{ COLLAGE_MAX }})</span>
          </div>
          <p class="photo-limits">{{ t('editSection.photos.limits') }}</p>
          <div class="story-images-grid-edit">
            <PhotoSlot
              v-for="idx in COLLAGE_MAX"
              :key="'collage-' + idx"
              :photo="photoSlot('collage', idx - 1)"
              :label="t('editSection.photos.collageSlot', { n: idx })"
              :placeholder="String(idx)"
              @pick="pickPhoto('collage', idx - 1, $event)"
              @remove="removePhoto('collage', idx - 1)"
              @restore="restorePhoto('collage', idx - 1)"
              @retry="retrySave"
              @broken="brokenPhoto('collage', idx - 1)"
            />
          </div>
        </template>
      </div>
    </template>

    <!-- RSVP -->
    <template v-if="isEditMode" #section-rsvp="{ subTab }">
      <EditRsvpModal
        v-if="subTab === 'content'"
        :open="true"
        :live-edit="true"
        :rsvp-deadline="rsvpConfig.deadline"
        :event-date-time="config.weddingDateTime"
        :event-timezone="config.eventTimezone"
        :guest-message="config.rsvpMessage"
        :max-guests="rsvpConfig.maxGuests"
        :show-dietary="rsvpConfig.showDietary"
        :border-radius="rsvpConfig.borderRadius"
        :allow-plus-one="rsvpConfig.allowPlusOne"
        :show-child="rsvpConfig.showChild"
        :contact-method="rsvpConfig.contactMethod"
        :custom-questions="rsvpConfig.customQuestions"
        :require-last-name="rsvpConfig.requireLastName"
        :hidden="!isSectionVisible('rsvp')"
        @show="setSectionShown('rsvp', true)"
        @close="toggleSection('rsvp')"
        @change="onRsvpChange"
      />
      <SectionAdvanced v-if="subTab === 'advanced'" section-key="rsvp" :visible="isSectionVisible('rsvp')" :anchor-id="sectionAdvancedState.rsvp?.anchorId || ''" :animation="sectionAdvancedState.rsvp?.animation || 'none'" :overrides="sectionOverrides.rsvp || null" @update="onAdvancedUpdate('rsvp', $event)" />
    </template>

    <!-- Style tab sections (no sub-tabs) -->
    <template v-if="isEditMode" #section-colors>
      <div class="theme-palette-picker">
        <!-- Preset palettes -->
        <p :id="paletteHeadingId" class="palette-picker-label">{{ t('editSection.chooseTheme') }}</p>
        <!-- INV-503: the chosen theme is pressed and ticked, not only outlined -->
        <div class="palette-grid" role="group" :aria-labelledby="paletteHeadingId">
          <button
            v-for="p in THEME_PALETTES"
            :key="p.name"
            type="button"
            :aria-pressed="activePaletteName === p.name ? 'true' : 'false'"
            :data-palette="p.name"
            class="palette-card"
            :class="{
              'palette-card--active': activePaletteName === p.name,
              'palette-card--dark': p.dark,
              'palette-card--original': p.original,
            }"
            :style="{ background: p.rootBg }"
            @click="applyThemePalette(p)"
          >
            <span class="palette-accent" :style="{ background: p.accent }" aria-hidden="true"></span>
            <span class="palette-info">
              <span class="palette-name" :style="{ color: p.text }">{{ p.original ? (preset.name + ' (Default)') : p.name }}</span>
              <span class="palette-tag" :style="{ color: p.secondary }">{{ p.original ? 'Original' : (p.dark ? 'Dark Luxe' : 'Pastel') }}</span>
            </span>
            <span v-if="activePaletteName === p.name" class="palette-selected" data-testid="palette-selected">✓ {{ t('editSection.a11y.selected') }}</span>
          </button>
        </div>

        <!-- Individual color overrides -->
        <div class="color-overrides">
          <p class="palette-picker-label" style="margin-top:20px">{{ t('editSection.customColors') || 'Custom Colors' }}</p>
          <div class="color-field" v-for="f in individualColorFields" :key="f.key" :data-color-field="f.key">
            <label class="color-field-label" :for="colorInputId(f.key)">{{ f.label }}</label>
            <div class="color-field-input">
              <input :id="colorInputId(f.key)" type="color" :value="f.value" @input="onIndividualColorChange(f.key, $event.target.value)" class="color-input" />
              <input
                type="text"
                :value="hexDrafts[f.key] ?? f.value"
                class="hex-input"
                maxlength="7"
                spellcheck="false"
                :aria-label="t('editSection.a11y.hexLabel', { color: f.label })"
                :aria-invalid="hexErrors[f.key] ? 'true' : undefined"
                :aria-describedby="hexErrors[f.key] ? colorInputId(f.key) + '-error' : undefined"
                @input="hexDrafts[f.key] = $event.target.value"
                @change="onHexChange(f.key, $event.target.value)"
              />
            </div>
            <p v-if="hexErrors[f.key]" :id="colorInputId(f.key) + '-error'" class="hex-error" data-testid="hex-error">
              {{ t('editSection.a11y.hexInvalid') }}
            </p>
          </div>

          <!-- INV-503: readability of the chosen colours (WCAG 4.5:1), in words -->
          <div class="color-contrast" data-testid="color-contrast">
            <p class="palette-picker-label">{{ t('editSection.readability') }}</p>
            <ul class="color-contrast__list">
              <li v-for="c in colorContrastChecks" :key="c.key" class="color-contrast__row" :data-contrast="c.key" :data-passes="c.passes ? 'true' : 'false'">
                <span class="color-contrast__label">{{ c.label }}</span>
                <span class="color-contrast__ratio">{{ c.ratio === null ? '—' : c.ratio + ':1' }}</span>
                <StatusPill :tone="c.passes ? 'ok' : 'warn'" :label="(c.passes ? '✓ ' : '! ') + (c.passes ? t('editSection.readabilityPass') : t('editSection.readabilityFail'))" />
              </li>
            </ul>
            <p v-if="colorContrastChecks.some((c) => !c.passes)" class="color-contrast__hint" role="status" data-testid="contrast-hint">
              {{ t('editSection.readabilityHint') }}
            </p>
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
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
import InvitationAuthDialog from '@/components/invitations/shared/InvitationAuthDialog.vue';
import DraftNotice from '@/components/invitations/shared/DraftNotice.vue';
import GuestPreviewBar from '@/components/invitations/shared/GuestPreviewBar.vue';
import { guestPreviewNotes, basicsProblems } from '@/utils/guestPreviewNotes';
import UnsavedChangesDialog from '@/components/invitations/shared/UnsavedChangesDialog.vue';
import { onboardingStore, setInvitationName, setInvitationPath } from '@/store/onboarding.store';
import CreationStepper from '@/components/onboarding/CreationStepper.vue';
import { useCreationSteps } from '@/composables/useCreationSteps';
import { editorCurrentStep, hasOwnDetails, isExampleItem, isUnsavedExample } from '@/utils/creationSteps';
import { usesCoupleNames, validateBasics, rsvpDeadlineProblem } from '@/utils/eventBasics';
import SectionEditButton from '@/components/invitations/shared/SectionEditButton.vue';
import { invitationImagesService } from '@/services/invitationImages.service.js';
import DesignSwitcher from '@/components/invitations/shared/DesignSwitcher.vue';
import PhotoSlot from '@/components/invitations/shared/PhotoSlot.vue';
import SectionStateNotice from '@/components/invitations/shared/SectionStateNotice.vue';
import StatusPill from '@/components/ui/StatusPill.vue';
import { parseHex } from '@/composables/useBrandContrast';
import { readabilityChecks } from '@/utils/colorReadability';
import { historyShortcut, isTextEditingTarget } from '@/composables/useEditHistory';
import { invitationTemplateService } from '@/services/invitationTemplate.service';
import {
  BUILDER_DESIGN_ID, switchableDesigns, designName, hiddenContentFor, ownStoryCounts,
} from '@/utils/designSwitch';

const route = useRoute();
// INV-103: "Edit entry" on the overlay opens the entry settings (part of the
// advanced settings) through the editor layout, which owns the mode.
const editLayoutRef = ref(null);
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
  heroFamily, detailsFamily, scheduleFamily, storyFamily,
  onHeroFamilyChange, onDetailsFamilyChange, onScheduleFamilyChange, onStoryFamilyChange,
  isEditMode, activeModal, activeRootSection, editingItem,
  closeModal, selectSection,
  dirty, previewMode, markDirty, clearDirty, saving,
  saveStatus, saveStatusDetail, lastSyncedAt, retrySave,
  authGateOpen, closeAuthGate, continueToAuth, unsavedPhotoCount,
  resumeMode, resumeConflict, photosToReAdd, saveDraftAsNewEvent, keepDraftForLater, discardDraft, dismissPhotosNotice,
  openGuestPreview, backToEditor, isDraftPreview, isNewUnsaved, flushBeforeLeaving, basicsKnown,
  leavePrompt, saveAndLeave, discardAndLeave, stayInEditor,
  historyState, undoEdit, redoEdit, onHistoryRestored,
  orderedSections, sectionVisibility, sectionLayouts, sectionOverrides, sectionAdvancedState,
  isSectionVisible, toggleVisibility, toggleSection,
  sectionHasContent, setSectionShown, sectionLoad,
  SIDEBAR_SECTIONS, SECTION_LAYOUTS, sectionStatuses,
  eventId, locale, isPrivate, backendData,
  agenda, eventDetails, ourStory,
  eventLoad, photos, pickPhoto, removePhoto, restorePhoto, brokenPhoto,
  rootStyle, colorFields, shadows, contrastCardBg, PALETTE_PRESETS, SHADOW_MAP, SPACING_MAP,
  onEntryChange, onInfoChange,
  onColorsChange, onFontsChange, onRsvpChange,
  onButtonsChange, onBackgroundChange, onSpacingChange,
  onAdvancedUpdate, onGlobalSave,
  onDetailsAdd, onDetailsEdit, onDetailsDelete,
  onAgendaAdd, onAgendaEdit, onAgendaDelete,
  onOurStoryAdd, onOurStoryEdit, onOurStoryDelete,
  onRsvpSubmit, t, extractFontName,
  setLayout,
  handleEventDetailSave, handleEventDetailUpdate, handleEventDetailDelete,
  handleAgendaSave, handleAgendaUpdate, handleAgendaDelete,
  handleOurStorySave, handleOurStoryUpdate, handleOurStoryDelete,
  OUR_STORY_FIELD_CONFIG,
} = inv;

// A title, not a couple, for everything but weddings and anniversaries (INV-104).
const titleMode = computed(() => {
  const category = backendData.value?.event?.eventCategory || (eventId ? '' : onboardingStore.selectedCategory);
  return !!category && !usesCoupleNames(category);
});

// "HH:mm" of the start, when one is set (INV-104).
const weddingTimeValue = computed(() => /T(\d{2}:\d{2})/.exec(config.weddingDateTime || '')?.[1] || '');

/*
 * Drawn inside the design catalogue's preview (INV-202): the page as a guest
 * sees it, without the flow's own bars, and an RSVP that is never sent — the
 * same page may be showing a real event's content (dashboard).
 */
const isEmbedPreview = computed(() => route.query.embed === '1' && route.query.preview === '1' && !isEditMode.value);
async function sendSampleRsvp() { /* a preview: nothing is sent */ }

/* ---- The final preview as a guest (INV-602) ------------------------ */
// The editor's own "preview as guest" (INV-104, ?preview=1): this page, its
// state and the renderer guests get — without the editor — in a phone or
// computer view, with notes on what guests will not see. Going back to
// editing keeps the page and its draft: it is the same route record.
const isGuestPreview = computed(() => isDraftPreview.value && !isEmbedPreview.value);

const PHONE_MAX = 767;
const previewDevice = ref(
  typeof window !== 'undefined' && window.matchMedia?.(`(max-width: ${PHONE_MAX}px)`)?.matches ? 'mobile' : 'desktop'
);

/** The public or the private link (the programme is only on the private one). */
function setPreviewPrivate(on) {
  if (!!on === isPrivate.value) return;
  const query = { ...route.query };
  if (on) query.isPrivate = 'true';
  else delete query.isPrivate;
  router.replace({ path: route.path, query });
}

const previewCategory = computed(() =>
  backendData.value?.event?.eventCategory || onboardingStore.selectedCategory || 'WEDDING'
);

const previewNotes = computed(() => {
  if (!isGuestPreview.value) return [];
  // The names, date and place: checked once they are the person's own (or
  // the event's) — the design's demo couple is said to be an example instead.
  const own = basicsKnown.value || !!eventId;
  const visible = (key) => isSectionVisible(key);
  const examples = (list, section) => list.filter((i) => !isUnsavedExample(i, section) && isExampleItem(i, section)).length;
  const date = (config.weddingDateTime || '').slice(0, 10);
  return guestPreviewNotes({
    basicsProblems: own ? basicsProblems(validateBasics(editorBasics.value, previewCategory.value)) : [],
    demoBasics: !own,
    nameField: titleMode.value ? 'title' : 'brideName',
    visible: {
      entry: visible('entry'), details: visible('details'), agendaList: visible('agendaList'),
      ourStoryList: visible('ourStoryList'), rsvp: visible('rsvp'),
    },
    hasContent: { agendaList: sectionHasContent.value.agendaList, ourStoryList: sectionHasContent.value.ourStoryList },
    examples: {
      agenda: examples(agenda.items.value, 'agenda'),
      ourStory: examples(ourStory.items.value, 'ourStory'),
    },
    ownDetails: eventDetails.items.value.filter((i) => !isExampleItem(i, 'eventDetails')).length,
    photos: {
      heroOwn: photos.slot('hero', 0).own,
      storyDrawn: storyImageMax.value,
      storyOwn: ownPhotoCount('story', storyImageMax.value),
      collageDrawn: entryType.value === 'gallery',
      collageOwn: collageOwnCount.value,
    },
    designHidden: hiddenContent.value,
    showAgenda: showAgenda.value,
    privateLink: isPrivate.value,
    rsvp: {
      deadlineProblem: rsvpDeadlineProblem(rsvpConfig.deadline, date, weddingTimeValue.value, config.eventTimezone),
      // An event not yet published takes no replies (the form is off for guests).
      notOpen: !!eventNotActive.value,
    },
  });
});

/**
 * A note's "Edit": back to the editor — the same page, so nothing typed is
 * lost — at the exact control: an Info field, a section, or the design.
 */
async function editFromPreview(note) {
  await backToEditor();
  await nextTick();
  await nextTick();
  showEntry.value = false;
  if (note.section === 'info' || note.section === 'design') {
    infoFocus.value = { field: note.section === 'design' ? 'design' : note.field, n: ++infoFocusSeq };
    return;
  }
  editLayoutRef.value?.requestSection(note.section, { focus: note.field !== 'deadline' });
  document.querySelector(`[data-edit-section="${note.section}"]`)?.scrollIntoView?.({ block: 'start' });
  if (note.field === 'deadline') {
    await nextTick();
    await nextTick();
    document.querySelector('[data-rsvp-field="deadline"] input')?.focus();
  }
}

/* ---- Steps of a new invitation (INV-102) -------------------------- */
// Shown while a new invitation is being made (?new=1) and is not an event yet:
// the editor is the Details and RSVP steps, the guest preview is Preview.
const router = useRouter();
const showStepper = computed(() =>
  !isEmbedPreview.value && route.query.new === '1' && (isEditMode.value ? isNewUnsaved.value : isDraftPreview.value)
);

// The editor's live basics — what the Event step is judged on in here.
const editorBasics = computed(() => {
  const wall = config.weddingDateTime || '';
  const title = titleMode.value;
  return {
    brideName: title ? '' : config.brideName || '',
    groomName: title ? '' : config.groomName || '',
    title: title ? config.brideName || '' : '',
    date: /^\d{4}-\d{2}-\d{2}/.test(wall) ? wall.slice(0, 10) : '',
    time: weddingTimeValue.value,
    timezone: config.eventTimezone,
    location: { name: config.venue || '', address: config.location || '' },
  };
});

const infoFocus = ref(null);
let infoFocusSeq = 0;

/** Opens the editor section of a step; from the preview, back to the editor first. */
async function openEditorStep(key, focusDeadline = false) {
  if (!isEditMode.value) {
    const query = { ...route.query, edit: 'true', step: key };
    delete query.preview;
    await router.push({ path: route.path, query });
    return;
  }
  // The entry overlay would cover the section being opened.
  showEntry.value = false;
  selectSection(key);
  if (focusDeadline) {
    await nextTick();
    await nextTick();
    document.querySelector('[data-rsvp-field="deadline"] input')?.focus();
  }
}

const { steps: creationSteps, go: goToStep } = useCreationSteps({
  current: () => editorCurrentStep({ preview: isDraftPreview.value, activeSection: activeRootSection.value }),
  context: () => ({
    // The design's demo couple is not the person's basics: until their own are
    // in the editor, the Event step is judged on what onboarding saved.
    basics: basicsKnown.value ? editorBasics.value : onboardingStore.eventDetails,
    hasDesign: true,
    hasDetails: hasOwnDetails({
      eventDetails: eventDetails.items.value,
      agenda: agenda.items.value,
      ourStory: ourStory.items.value,
    }),
    rsvpDeadline: rsvpConfig.deadline || '',
  }),
  handlers: {
    fix: (step, problem) => {
      if (step === 'event' && isEditMode.value && basicsKnown.value && problem.field !== 'category' && problem.field !== 'type') {
        // Names, date, time, zone and place are all in the Info panel here.
        infoFocus.value = { field: problem.field, n: ++infoFocusSeq };
        return true;
      }
      if (step === 'rsvp') {
        openEditorStep('rsvp', true);
        return true;
      }
      return false;
    },
    open: (step) => {
      if (step === 'details' || step === 'rsvp') {
        openEditorStep(step);
        return true;
      }
      if (step === 'preview') {
        if (isEditMode.value) openGuestPreview();
        return true;
      }
      return false;
    },
    // Leaving for the Event or Design step: the draft is written first.
    leave: () => (isEditMode.value ? flushBeforeLeaving() : undefined),
  },
});

const infoInvalidFields = computed(() => !basicsKnown.value ? [] :
  (creationSteps.value.find((s) => s.key === 'event')?.problems || []).map((p) => p.field)
);

// Arriving from another step at the Details or RSVP step (?step=…).
watch(
  () => [route.query.step, isEditMode.value],
  ([step, editing]) => {
    if (editing && showStepper.value && (step === 'rsvp' || step === 'details')) openEditorStep(step);
  },
  { immediate: true },
);

// INV-601: arriving from the check before publishing (?fix=<field>) — the
// editor opens at that exact control once the event is loaded: an Info field,
// or the RSVP deadline. Used once, then taken off the address.
const FIX_INFO_FIELDS = new Set(['brideName', 'groomName', 'title', 'date', 'time', 'timezone', 'location']);
watch(
  () => [route.query.fix, isEditMode.value, loading.value],
  async ([fix, editing, busy]) => {
    if (!fix || !editing || busy) return;
    const query = { ...route.query };
    delete query.fix;
    await router.replace({ path: route.path, query });
    await nextTick();
    showEntry.value = false;
    if (fix === 'rsvpDeadline') {
      openEditorStep('rsvp', true);
    } else if (FIX_INFO_FIELDS.has(fix)) {
      // A title-only event names its title where the first name goes.
      const field = titleMode.value && (fix === 'brideName' || fix === 'groomName') ? 'title' : fix;
      infoFocus.value = { field, n: ++infoFocusSeq };
    }
  },
  { immediate: true },
);

// Remember where this design opens, so the other steps can lead back to it.
onMounted(() => {
  if (route.query.new !== '1') return;
  // A preview only looks (INV-201): a design opened from the catalogue's
  // "Preview" must not become the chosen one. The editor's own "preview as
  // guest" is the design already recorded when it was opened for editing.
  if (route.query.preview === '1') return;
  const path = route.path.replace(/^\/[^/]+\//, '');
  if (path.startsWith('invitations/')) setInvitationPath(path);
});

// Event not active → disable RSVP submit
const eventNotActive = computed(() => {
  const s = backendData.value?.event?.status;
  return s && s !== 'ACTIVE';
});

/* ---- Changing the design (INV-203) --------------------------------- */
// The design is the route's :design. Changing it keeps this page and its
// state: only the look is reset to the new preset (or to how that design was
// left earlier in this visit); every piece of content stays. Watched by id,
// not by preset — the builder and Coastal Breeze share one preset.
const paletteNameByDesign = new Map();
watch(designId, (to, from) => {
  if (!to || to === from) return;
  paletteNameByDesign.set(from, activePaletteName.value);
  inv.resetToPreset(preset.value, { from, to });
  activePaletteName.value = paletteNameByDesign.get(to) ?? 'Original';
  // A changed design is a change to save (autosave picks it up).
  if (isEditMode.value) markDirty();
  // INV-801: the new look is not an undoable step; steps about the old
  // design's style no longer apply (content steps stay).
  inv.forgetStyleHistory();
});

const switchDesigns = ref([]);
const designsLoading = ref(false);
const designsError = ref(false);
const designSwitching = ref(false);
const designAnnouncement = ref('');
let designsLoaded = false;

// The designs of this event's category — the same list as the catalogue.
const switchCategory = computed(() =>
  backendData.value?.event?.eventCategory || onboardingStore.selectedCategory || 'WEDDING'
);

async function loadDesigns() {
  if (designsLoading.value) return;
  designsLoading.value = true;
  designsError.value = false;
  try {
    const list = await invitationTemplateService.listByCategory(switchCategory.value);
    switchDesigns.value = switchableDesigns(Array.isArray(list) ? list : []);
    designsLoaded = true;
  } catch (e) {
    console.error('Failed to load designs:', e);
    designsError.value = true;
  } finally {
    designsLoading.value = false;
  }
}

function onDesignSwitchOpen() {
  if (!designsLoaded) loadDesigns();
}

const currentDesignName = computed(() =>
  designId.value === BUILDER_DESIGN_ID
    ? t('editSection.designSwitch.builderName')
    : designName(designId.value, switchDesigns.value)
);

async function switchDesign(target) {
  if (!target?.presetId || target.presetId === designId.value || designSwitching.value) return;
  designSwitching.value = true;
  designAnnouncement.value = '';
  // Not leaving the editor — the content stays on this page — so the
  // "unsaved changes" guard (meant for leaving) is not asked; the design
  // watcher marks the invitation unsaved again right after.
  const wasDirty = dirty.value;
  clearDirty();
  try {
    await router.replace({
      name: route.name,
      params: { ...route.params, design: target.presetId },
      query: { ...route.query },
    });
  } catch (e) {
    console.error('Design switch navigation failed:', e);
  } finally {
    designSwitching.value = false;
  }
  if (designId.value !== target.presetId) {
    if (wasDirty) markDirty();
    return;
  }
  // A new invitation: the other steps (stepper, resume) open this design now.
  if (isNewUnsaved.value) {
    setInvitationName(target.templateId);
    setInvitationPath(`invitations/${target.presetId}`);
  }
  designAnnouncement.value = t('editSection.designSwitch.switched', { name: target.name });
}

// What the person added that the current look does not draw (kept, and said).
const hiddenContent = computed(() => hiddenContentFor(
  { storyFamily: storyFamily.value, entryType: entryType.value, entryVisible: isSectionVisible('entry') },
  {
    storyPhotos: ownPhotoCount('story', 4),
    collagePhotos: ownPhotoCount('collage', COLLAGE_MAX),
    ...ownStoryCounts(ourStory.items.value),
  },
));

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

/* ---- Photo slots (INV-403) ---------------------------------------- */
// Each slot shows what its photo is in (useInvitationPhotos): the editor's
// state, not a guess. The design's demo photo fills a slot nobody chose a
// photo for, marked as an example.

// Default placeholder images from config (set on init)
const defaultStoryPhotos = config.storyPhotos.map(p => p.url);
const COLLAGE_MAX = 6;
const defaultCollagePhotos = config.galleryPhotos.map(p => p.url);
const EXAMPLES = { story: defaultStoryPhotos, collage: defaultCollagePhotos, hero: [] };

/** A slot as the editor shows it (reactive: read in the template). */
function photoSlot(name, index) {
  return photos.slot(name, index, EXAMPLES[name]?.[index] || '');
}

function ownPhotoCount(name, size) {
  let n = 0;
  for (let i = 0; i < size; i++) if (photos.slot(name, i).own) n++;
  return n;
}

const collageOwnCount = computed(() => ownPhotoCount('collage', COLLAGE_MAX));

// What the preview draws: the picked photo, the saved one, or the example.
// Only in the editor — guests see the event's own photos (applyBackendData).
const storyPreviewUrls = computed(() => {
  const urls = [];
  for (let i = 0; i < storyImageMax.value; i++) {
    const url = photos.previewUrl('story', i, defaultStoryPhotos[i] || '');
    if (url) urls.push(url);
  }
  return urls;
});

watch(storyPreviewUrls, (urls) => {
  if (!isEditMode.value || !urls.length) return;
  config.storyPhotos = urls.map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
  config.storyImageUrl = urls[0];
}, { immediate: true });

const collagePreviewUrls = computed(() => {
  const urls = [];
  for (let i = 0; i < COLLAGE_MAX; i++) {
    const url = photos.previewUrl('collage', i, defaultCollagePhotos[i] || '');
    if (url) urls.push(url);
  }
  return urls;
});

watch(collagePreviewUrls, (urls) => {
  if (!isEditMode.value || !urls.length) return;
  config.galleryPhotos = urls.map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
});

// Dynamic section components - reactive to user selection
const heroComponent = computed(() => HERO_COMPONENTS[heroFamily.value] || null);
const detailsComponent = computed(() => DETAILS_COMPONENTS[detailsFamily.value] || DETAILS_COMPONENTS.coastal);
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
  // Which palette is marked chosen is set with the design (watch on designId).
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
// INV-503: a typed hex code not applied yet, and whether it was wrong.
const hexDrafts = reactive({});
const hexErrors = reactive({});

function applyThemePalette(p) {
  activePaletteName.value = p.name;
  // A typed code that was never applied does not outlive the theme.
  for (const k of Object.keys(hexDrafts)) delete hexDrafts[k];
  for (const k of Object.keys(hexErrors)) hexErrors[k] = false;
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

/* ---- Undo / redo (INV-801) ----------------------------------------- */
// After undo / redo the colours on screen may be another theme's (or none):
// the theme marked chosen follows them, and a typed code not applied goes.
function paletteNameFor() {
  const same = (a, b) => (a || '').toLowerCase() === (b || '').toLowerCase();
  const match = THEME_PALETTES.find((p) => same(p.rootBg, rootBg.value) && same(p.accent, palette.accent)
    && same(p.secondary, palette.secondary) && same(p.text, palette.text));
  return match ? match.name : '';
}

onHistoryRestored((step) => {
  if (!step.keys.includes('colors')) return;
  activePaletteName.value = paletteNameFor();
  for (const k of Object.keys(hexDrafts)) delete hexDrafts[k];
  for (const k of Object.keys(hexErrors)) hexErrors[k] = false;
});

// Ctrl/⌘+Z and Ctrl/⌘+Shift+Z (Ctrl+Y). Not while typing in a field — that
// field's own undo is the browser's — and not while a dialog asks something.
function onHistoryKeydown(e) {
  if (!isEditMode.value || e.defaultPrevented || isTextEditingTarget(e.target)) return;
  if (leavePrompt.open || authGateOpen.value || resumeMode.value === 'choose') return;
  const action = historyShortcut(e);
  if (!action) return;
  e.preventDefault();
  if (action === 'undo') undoEdit();
  else redoEdit();
}
onMounted(() => window.addEventListener('keydown', onHistoryKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onHistoryKeydown));

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

// INV-503: a typed hex is checked and, when wrong, said so next to the field.
const colorInputId = (key) => `color-field-${key}`;
const paletteHeadingId = 'palette-heading';

function onHexChange(key, raw) {
  const value = (raw || '').trim();
  if (!parseHex(value)) {
    hexErrors[key] = true;
    return;
  }
  hexErrors[key] = false;
  delete hexDrafts[key];
  onIndividualColorChange(key, value);
}

// What guests read on the colours as they are now (the cards as drawn).
const colorContrastChecks = computed(() => readabilityChecks({
  text: palette.text,
  rootBg: rootBg.value,
  sectionBg: cardStyle.sectionBg,
  cardBg: contrastCardBg.value,
  buttonText: buttonStyle.text,
  buttonBg: buttonStyle.bg,
}).map((c) => ({ ...c, label: t('editSection.a11y.pairs.' + c.key) })));

function onIndividualColorChange(key, value) {
  if (!value || !value.startsWith('#')) return;
  delete hexDrafts[key];
  hexErrors[key] = false;
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

const DETAILS_FAMILY_OPTIONS = [
  { key: 'coastal', label: 'Info Cards', diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="4" width="18" height="18" rx="2" fill="#d1d5db"/><rect x="23" y="4" width="18" height="18" rx="2" fill="#d1d5db"/><rect x="44" y="4" width="18" height="18" rx="2" fill="#d1d5db"/><rect x="12" y="28" width="40" height="6" rx="1" fill="#e5e7eb"/></svg>' },
  { key: 'parisian', label: 'Elegant Timeline', diagram: '<svg viewBox="0 0 64 48"><line x1="32" y1="4" x2="32" y2="44" stroke="#9ca3af" stroke-width="1"/><rect x="4" y="6" width="24" height="14" rx="2" fill="#d1d5db"/><rect x="36" y="14" width="24" height="14" rx="2" fill="#d1d5db"/><rect x="4" y="32" width="24" height="14" rx="2" fill="#d1d5db"/></svg>' },
  { key: 'persian', label: 'Glass Panels', diagram: '<svg viewBox="0 0 64 48"><rect x="4" y="4" width="56" height="18" rx="4" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/><rect x="12" y="8" width="20" height="4" rx="1" fill="#9ca3af"/><rect x="12" y="14" width="30" height="3" rx="1" fill="#d1d5db"/><rect x="4" y="26" width="56" height="18" rx="4" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/><rect x="12" y="30" width="20" height="4" rx="1" fill="#9ca3af"/><rect x="12" y="36" width="30" height="3" rx="1" fill="#d1d5db"/></svg>' },
  { key: 'chateau', label: 'Split Cards', diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="28" height="20" rx="2" fill="#d1d5db"/><rect x="34" y="2" width="28" height="20" rx="2" fill="#e5e7eb"/><rect x="2" y="26" width="28" height="20" rx="2" fill="#e5e7eb"/><rect x="34" y="26" width="28" height="20" rx="2" fill="#d1d5db"/></svg>' },
  { key: 'collage', label: 'Photo Collage', diagram: '<svg viewBox="0 0 64 48"><rect x="2" y="2" width="18" height="20" rx="2" fill="#d1d5db"/><rect x="23" y="2" width="18" height="20" rx="2" fill="#d1d5db"/><rect x="44" y="2" width="18" height="20" rx="2" fill="#d1d5db"/><rect x="8" y="26" width="48" height="6" rx="1" fill="#e5e7eb"/><rect x="12" y="36" width="40" height="6" rx="1" fill="#e5e7eb"/></svg>' },
  { key: 'editorial', label: 'Minimal Cards', diagram: '<svg viewBox="0 0 64 48"><rect x="4" y="4" width="56" height="8" rx="1" fill="#e5e7eb"/><line x1="24" y1="4" x2="24" y2="12" stroke="#d1d5db"/><rect x="4" y="16" width="56" height="8" rx="1" fill="#e5e7eb"/><line x1="24" y1="16" x2="24" y2="24" stroke="#d1d5db"/><rect x="4" y="28" width="56" height="8" rx="1" fill="#e5e7eb"/></svg>' },
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

const STORY_MAX_ITEMS_BUILDER = { parisian: 1 };
const storyMaxItems = computed(() =>
  isBuilder.value ? (STORY_MAX_ITEMS_BUILDER[storyFamily.value] || 0) : 0
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
  mapLabel: t('invitation.viewMap'),
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
  gradientStart: rootBg.value,
  gradientMid: cardStyle.sectionBg || rootBg.value,
  gradientEnd: rootBg.value,
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
/* INV-202: the catalogue's preview — sample content is labelled as such */
.sample-preview-badge {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  max-width: calc(100% - 24px);
  margin: 0;
  padding: 6px 12px;
  border-radius: 999px;
  background: #fef0c7;
  color: #93370d;
  font-family: system-ui, sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.15);
  pointer-events: none;
}

.sample-preview-rsvp {
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #fef0c7;
  color: #93370d;
  font-size: 13px;
  text-align: center;
}

.unified-invitation {
  container-type: inline-size;
  /* INV-602: a long name, title or word wraps inside its card instead of
     pushing the invitation wider than a phone (checked in the guest preview). */
  overflow-wrap: anywhere;
  font-family: var(--font-body);
  background: var(--root-bg, #fff);
  color: var(--theme-text, var(--ink-2));
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

.section { padding: var(--section-padding, 80px 24px); }
.section-inner { max-width: 1200px; margin: 0 auto; padding: 0 16px; }
.section--base { background: var(--root-bg, #fff); }
.section--alt { background: var(--section-bg, var(--sunken)); }
.section--editing { outline: 2px dashed var(--theme-accent, #60a5fa); outline-offset: -2px; }

.section-header { text-align: center; margin-bottom: var(--content-gap, 32px); }
.section-title { font-family: var(--font-heading); font-size: 36px; font-weight: 400; color: var(--theme-text, var(--ink)); margin: 0 0 12px; }
.section-divider { width: 64px; height: 1px; background: var(--theme-secondary, #fda4af); margin: 0 auto; }

.details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--content-gap, 24px); margin-bottom: var(--content-gap, 32px); }
.card-svg { width: 100%; height: 100%; }
.map-link { display: flex; align-items: center; gap: 4px; font-family: var(--font-body); font-size: 13px; font-weight: 500; color: var(--theme-accent, #60a5fa); text-decoration: none; transition: opacity 0.2s; }
.map-link:hover { opacity: 0.8; }
.bold { font-weight: 600; }

.countdown-bar { margin-top: var(--content-gap, 32px); padding: 24px; background: var(--card-bg, #fff); border-radius: var(--card-radius, 24px); box-shadow: var(--card-shadow, 0px 4px 20px rgba(0,0,0,0.08)); }

.rsvp-header { text-align: center; margin-bottom: var(--content-gap, 32px); }
.rsvp-subtitle { font-family: var(--font-body); font-size: 15px; color: var(--theme-text, var(--ink-3)); opacity: 0.7; margin-top: 12px; }
.rsvp-wrapper { max-width: 640px; margin: 0 auto; background: var(--card-bg, #fff); padding: var(--card-padding, 32px); border-radius: var(--card-radius, 24px); box-shadow: var(--card-shadow, 0px 4px 20px rgba(0,0,0,0.08)); }

.loading-overlay { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.loading-spinner { width: 36px; height: 36px; border: 3px solid var(--line); border-top-color: var(--theme-accent, #60a5fa); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Scroll reveal — disabled in edit mode so sections stay visible */
.unified-invitation:not(.edit-active) [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
.unified-invitation:not(.edit-active) [data-reveal].revealed { opacity: 1; transform: translateY(0); }
.unified-invitation.edit-active [data-reveal] { opacity: 1; transform: none; }

.family-picker-wrap { padding: 0; }

/* INV-402: an empty section in the editor preview — guests never see it. */
.section-empty-hint {
  margin: 0 auto;
  max-width: 420px;
  padding: 16px;
  border: 1px dashed currentColor;
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
  font-style: italic;
  opacity: 0.8;
}
.family-picker-label { font-size: 13px; font-weight: 600; color: var(--ink-2); margin: 0 0 8px; }

/* Story image upload (Parisian single image) */
.story-image-upload { padding: 0 0 12px; border-bottom: 1px solid var(--line); margin-bottom: 4px; }
.story-image-label { font-size: 12px; font-weight: 700; color: var(--neutral-500, var(--ink-3)); text-transform: uppercase; letter-spacing: 0.03em; margin: 0 0 8px; }
.story-image-preview-wrap { border-radius: 10px; overflow: hidden; border: 1px solid var(--line); }
.story-image-preview { width: 100%; max-height: 160px; object-fit: cover; display: block; }
.story-image-change-btn { display: block; width: 100%; padding: 8px; border: none; background: var(--sunken); font-size: 12px; font-weight: 600; color: var(--brand-main, var(--ink)); cursor: pointer; font-family: inherit; }
.story-image-change-btn:hover { background: var(--sunken); }
.story-image-drop { border: 2px dashed var(--line-2); border-radius: 10px; padding: 24px 16px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; color: var(--ink-4); transition: border-color 0.2s, color 0.2s; font-size: 13px; font-weight: 600; }
.story-image-drop:hover { border-color: var(--brand-gold, var(--brand-gold)); color: var(--brand-gold, var(--brand-gold)); }

/* Story images button (Persian gallery) */
.story-images-btn-wrap { padding: 0 0 8px; border-bottom: 1px solid var(--line); margin-bottom: 4px; }
.story-images-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border: 1px solid var(--line); border-radius: 10px; background: #fff; font-size: 13px; font-weight: 600; color: var(--ink-2); cursor: pointer; font-family: inherit; transition: all 0.15s; }
.story-images-btn:hover { background: var(--sunken); border-color: var(--line-2); }

/* Story Images panel (separate section) */
.story-images-panel { padding: 12px 16px; }
.story-images-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.story-images-add-btn { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border: 1px solid var(--line); border-radius: 8px; background: #fff; font-size: 12px; font-weight: 600; color: var(--ink-2); cursor: pointer; font-family: inherit; transition: all 0.15s; }
.story-images-add-btn:hover { background: var(--sunken); border-color: var(--line-2); }
.story-images-add-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.story-images-grid-edit { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
.photo-limits { font-size: 12px; color: var(--ink-3); line-height: 1.45; margin: 0 0 10px; }
.story-img-thumb { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 1px solid var(--line); }
.story-img-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.story-img-remove { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; border: none; background: rgba(0,0,0,0.55); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
.story-img-thumb:hover .story-img-remove { opacity: 1; }
.story-img-remove:hover { background: rgba(220,38,38,0.85); }
.story-img-progress { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; color: var(--ink-3); }
.story-img-spinner { width: 16px; height: 16px; border: 2px solid var(--line); border-top-color: var(--brand-gold, var(--brand-gold)); border-radius: 50%; animation: spin 0.6s linear infinite; }
.story-images-empty { font-size: 13px; color: var(--ink-4); text-align: center; padding: 16px 0; }
.story-img-thumb--empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: var(--sunken); border: 2px dashed var(--line-2); cursor: pointer; transition: border-color 0.15s, color 0.15s; color: var(--ink-4); }
.story-img-thumb--empty:hover { border-color: var(--brand-gold, var(--brand-gold)); color: var(--brand-gold, var(--brand-gold)); }
.placeholder-label { font-size: 10px; font-weight: 600; text-align: center; }
.story-img-badge { position: absolute; bottom: 4px; right: 4px; width: 18px; height: 18px; border-radius: 50%; background: #059669; color: #fff; display: flex; align-items: center; justify-content: center; }
.story-img-thumb { cursor: pointer; }
.story-img-thumb img { pointer-events: none; }
.story-images-info { padding: 8px 0; }
.story-images-info-text { font-size: 13px; color: var(--ink-3); line-height: 1.5; margin: 0; }

/* Theme palette picker */
.theme-palette-picker { padding: 0; }
.palette-picker-label { font-size: 13px; font-weight: 600; color: var(--ink-2); margin: 0 0 12px; }
.palette-grid { display: flex; flex-direction: column; gap: 6px; }
.palette-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 2px solid var(--line);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.palette-card:hover { border-color: var(--ink-4); }
.palette-card--active { border-color: var(--ink); box-shadow: 0 0 0 1px var(--ink); }
.palette-card--dark { border-color: #2a2a2a; }
.palette-card--dark:hover { border-color: #555; }
.palette-card--dark.palette-card--active { border-color: var(--brand-gold); box-shadow: 0 0 0 1px var(--brand-gold); }
.palette-card--original { border-style: dashed; }
.palette-accent { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; }
.palette-info { display: flex; flex-direction: column; gap: 1px; }
.palette-name { font-size: 13px; font-weight: 600; line-height: 1.2; }
.palette-tag { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

/* Individual color overrides */
.color-overrides { margin-top: 4px; }
.color-field { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
.color-field-label { font-size: 12px; font-weight: 500; color: var(--ink-2); }
.color-field-input { display: flex; align-items: center; gap: 6px; }
.color-input { width: 28px; height: 28px; border: 1px solid var(--line-2); border-radius: 6px; cursor: pointer; padding: 0; background: none; }
.color-input::-webkit-color-swatch-wrapper { padding: 2px; }
.color-input::-webkit-color-swatch { border-radius: 4px; border: none; }
.hex-input { width: 72px; padding: 4px 8px; border: 1px solid var(--line); border-radius: 6px; font-size: 11px; font-family: monospace; color: var(--ink-2); text-align: center; }

/* INV-503: chosen in words, wrong hex in words, readability in words */
.color-field { flex-wrap: wrap; }
.palette-selected { margin-left: auto; padding: 1px 8px; border-radius: 999px; background: #fff; color: #1f2937; border: 1px solid #1f2937; font-size: 11px; font-weight: 700; white-space: nowrap; }
.hex-input[aria-invalid="true"] { border-color: #b91c1c; border-width: 2px; }
.hex-error { flex-basis: 100%; margin: 4px 0 0; font-size: 12px; color: #b91c1c; }
.color-contrast { margin-top: 16px; }
.color-contrast__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.color-contrast__row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--ink-2); }
.color-contrast__label { flex: 1; min-width: 0; }
.color-contrast__ratio { font-variant-numeric: tabular-nums; color: var(--ink-3); }
.color-contrast__hint { margin: 8px 0 0; font-size: 12px; line-height: 1.4; color: var(--ink-2); }
.palette-card:focus-visible, .color-input:focus-visible, .hex-input:focus-visible { outline: 3px solid var(--moss, #5e7f58); outline-offset: 2px; }

@container (min-width: 1024px) { .section-title { font-size: 48px; } }
</style>

<!-- Unscoped: auto-contrast text colors per background zone -->
<style>
/* ---- Root-level text (on --root-bg) ---- */
.unified-invitation {
  color: var(--theme-text, var(--ink));
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
  color: var(--section-text, var(--ink));
}

/* ---- Base section text (on --root-bg) ---- */
.unified-invitation .section--base .section-title,
.unified-invitation .section--base .section-header,
.unified-invitation .section--base .schedule-title,
.unified-invitation .section--base .agenda-title,
.unified-invitation .section--base .timeline-title,
.unified-invitation .section--base .timeline-heading {
  color: var(--theme-text, var(--ink));
}

/* ---- Schedule/Agenda items (on section bg) ---- */
.unified-invitation .section--base .schedule-item .item-title,
.unified-invitation .section--base .schedule-item .time-value,
.unified-invitation .section--base .agenda-item .item-title,
.unified-invitation .section--base .event-title,
.unified-invitation .section--base .time-badge,
.unified-invitation .section--base .time-pill {
  color: var(--theme-text, var(--ink));
}
.unified-invitation .section--base .schedule-item .item-description,
.unified-invitation .section--base .schedule-item .time-period,
.unified-invitation .section--base .agenda-item .item-description,
.unified-invitation .section--base .agenda-item .item-venue,
.unified-invitation .section--base .event-subtitle {
  color: var(--theme-text-muted, var(--ink-3));
}

.unified-invitation .section--alt .schedule-item .item-title,
.unified-invitation .section--alt .schedule-item .time-value,
.unified-invitation .section--alt .agenda-item .item-title,
.unified-invitation .section--alt .event-title,
.unified-invitation .section--alt .time-badge,
.unified-invitation .section--alt .time-pill {
  color: var(--section-text, var(--ink));
}
.unified-invitation .section--alt .schedule-item .item-description,
.unified-invitation .section--alt .schedule-item .time-period,
.unified-invitation .section--alt .agenda-item .item-description,
.unified-invitation .section--alt .agenda-item .item-venue,
.unified-invitation .section--alt .event-subtitle {
  color: var(--section-text-muted, var(--ink-3));
}

/* ---- Our Story items ---- */
.unified-invitation .section--alt .story-card .card-title,
.unified-invitation .section--alt .card-heading {
  color: var(--section-text, var(--ink));
}
.unified-invitation .section--alt .story-card .card-description,
.unified-invitation .section--alt .story-card .card-date,
.unified-invitation .section--alt .card-text {
  color: var(--section-text-muted, var(--ink-3));
}

/* ---- Card-level text (on --card-bg) ---- */
.unified-invitation .detail-card .detail-title {
  color: var(--card-text, var(--ink));
}
.unified-invitation .detail-card .detail-body,
.unified-invitation .detail-card .detail-body p,
.unified-invitation .detail-card .detail-footer {
  color: var(--card-text-muted, var(--ink-3));
}
.unified-invitation .countdown-bar {
  color: var(--card-text, var(--ink));
}

/* ---- RSVP text ---- */
.unified-invitation .rsvp-header .section-title,
.unified-invitation .rsvp-form .rsvp-title {
  color: var(--theme-text, var(--ink)) !important;
}
.unified-invitation .rsvp-subtitle {
  color: var(--theme-text-muted, var(--ink-3)) !important;
}
.unified-invitation .rsvp-form label,
.unified-invitation .rsvp-form .field-label,
.unified-invitation .rsvp-form .guest-name,
.unified-invitation .rsvp-form .section-label {
  color: var(--theme-text, var(--ink)) !important;
}
.unified-invitation .rsvp-form input,
.unified-invitation .rsvp-form textarea,
.unified-invitation .rsvp-form select {
  background: var(--item-bg, var(--sunken)) !important;
  color: var(--theme-text, var(--ink)) !important;
  border-color: var(--theme-text-muted, var(--line-2)) !important;
}
.unified-invitation .rsvp-wrapper {
  background: var(--card-bg, #fff);
}

/* ---- Force all text inside schedule/agenda to use theme colors ---- */
.unified-invitation .section--base .schedule-title,
.unified-invitation .section--base .item-title,
.unified-invitation .section--base .time-value,
.unified-invitation .section--base .agenda-title {
  color: var(--theme-text, var(--ink)) !important;
}
.unified-invitation .section--base .item-description,
.unified-invitation .section--base .time-period {
  color: var(--theme-text-muted, var(--ink-3)) !important;
}
.unified-invitation .section--alt .schedule-title,
.unified-invitation .section--alt .gallery-title,
.unified-invitation .section--alt .item-title,
.unified-invitation .section--alt .time-value {
  color: var(--section-text, var(--ink)) !important;
}
.unified-invitation .section--alt .item-description,
.unified-invitation .section--alt .time-period {
  color: var(--section-text-muted, var(--ink-3)) !important;
}

/* ---- Detail card internal text ---- */
.unified-invitation .detail-card .card-title {
  color: var(--card-text, var(--ink)) !important;
}
.unified-invitation .detail-card p,
.unified-invitation .detail-card .map-link {
  color: var(--card-text-muted, var(--ink-3)) !important;
}
.unified-invitation .detail-card .bold {
  color: var(--card-text, var(--ink)) !important;
}

/* ---- Countdown text ---- */
.unified-invitation .countdown-bar .countdown-value,
.unified-invitation .countdown-bar .countdown-label,
.unified-invitation .countdown-bar .timer-number,
.unified-invitation .countdown-bar .timer-label {
  color: var(--card-text, var(--ink)) !important;
}

/* ---- Hero text ---- */
.unified-invitation .hero-subtitle,
.unified-invitation .hero-date,
.unified-invitation .hero-venue,
.unified-invitation .hero-location,
.unified-invitation .hero-label {
  color: var(--theme-text-muted, var(--ink-3));
}
.unified-invitation .hero-title,
.unified-invitation .hero-names,
.unified-invitation .hero-couple {
  color: var(--theme-text, var(--ink));
}

/* ---- Time badge/pill backgrounds + text (contrast with badge bg, not section bg) ---- */
.unified-invitation .section--base .time-badge {
  background: var(--badge-bg, #f6f1e3);
  color: var(--badge-text, var(--ink));
}
.unified-invitation .section--alt .time-badge {
  background: var(--badge-bg-alt, #f6f1e3);
  color: var(--badge-text-alt, var(--ink));
}
.unified-invitation .section--base .time-pill {
  background: var(--badge-bg, #f6f1e3) !important;
  color: var(--badge-text, var(--ink));
}
.unified-invitation .section--alt .time-pill {
  background: var(--badge-bg-alt, #f6f1e3) !important;
  color: var(--badge-text-alt, var(--ink));
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
