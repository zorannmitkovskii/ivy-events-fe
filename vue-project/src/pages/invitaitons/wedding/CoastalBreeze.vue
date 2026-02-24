<template>
  <div ref="rootRef" class="coastal-breeze">
    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <div v-show="!loading">
    <!-- Hero -->
    <div style="position:relative;">
    <SectionEditButton :visible="isEditMode" :label="t('editSection.hero')" variant="dark" @click="openModal('hero')" />
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
      :accent-color="palette.blue100"
      :accent-hover="palette.blue200"
      :divider-color="palette.rose300"
      :heading-font="fonts.heading"
      :body-font="fonts.body"
    />
    </div>

    <!-- Event Details -->
    <section class="section section--gray" data-reveal style="position:relative;">
      <SectionEditButton :visible="isEditMode" :label="t('editSection.details')" @click="openModal('details')" />
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">{{ t('invitation.eventDetails') }}</h2>
          <div class="section-divider"></div>
        </div>

        <div class="details-grid">
          <!-- Ceremony -->
          <DetailCard
            :title="config.ceremonyVenue || t('invitation.ceremony')"
            bg-color="#fff"
            border-width="0"
            border-radius="24px"
            :shadow="shadows.card"
            :hover-shadow="shadows.cardHover"
            :icon-bg="palette.blue100"
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
            bg-color="#fff"
            border-width="0"
            border-radius="24px"
            :shadow="shadows.card"
            :hover-shadow="shadows.cardHover"
            :icon-bg="palette.rose100"
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
            bg-color="#fff"
            border-width="0"
            border-radius="24px"
            :shadow="shadows.card"
            :hover-shadow="shadows.cardHover"
            :icon-bg="palette.blue100"
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
            :colors="[palette.gray800, palette.gray800, palette.gray800]"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            label-color="#4b5563"
            unit-label-color="#6b7280"
          />
        </div>
      </div>
    </section>

    <!-- Schedule -->
    <section v-if="showAgenda && !isPrivate" class="section section--white" data-reveal style="position:relative;">
      <SectionEditButton :visible="isEditMode" :label="t('editSection.agenda')" @click="openModal('agendaList')" />
      <div class="section-inner">
        <ScheduleList
          :title="t('invitation.schedule')"
          :events="config.scheduleEvents"
          :divider-color="palette.rose300"
          :heading-font="fonts.heading"
          :body-font="fonts.body"
        />
      </div>
    </section>

    <!-- Our Story -->
    <section v-if="showOurStory" class="section section--gray" data-reveal style="position:relative;">
      <SectionEditButton :visible="isEditMode" :label="t('editSection.ourStory')" @click="openModal('ourStoryList')" />
      <SectionEditButton :visible="isEditMode" :label="t('ourStory.images.upload')" @click="openModal('ourStoryImages')" style="right: 180px;" />
      <div class="section-inner">
        <StoryGallery
          :title="t('invitation.ourStory')"
          :stories="config.stories"
          :divider-color="palette.rose300"
          :heading-font="fonts.heading"
          :body-font="fonts.body"
        />
      </div>
    </section>

    <!-- RSVP -->
    <section id="rsvp-section" class="section section--white" data-reveal>
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
            :accent-color="palette.blue200"
            :accept-color="palette.blue100"
            :decline-color="palette.rose100"
            :button-bg="palette.gray800"
            button-text="#fff"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            border-radius="8px"
            @submit="onRsvpSubmit"
          />
        </div>
      </div>
    </section>

    <!-- Edit Mode Modals -->
    <template v-if="isEditMode">
      <EditDetailsModal
        :open="activeModal === 'details'"
        :items="eventDetails.items.value"
        @close="closeModal"
        @add="onDetailsAdd"
        @edit="onDetailsEdit"
        @delete="onDetailsDelete"
      />
      <AddEventDetailModal
        :open="activeModal === 'eventDetail'"
        :item="editingItem"
        :items="eventDetails.items.value"
        @close="closeModal"
        @submit="handleEventDetailSave"
        @delete="handleEventDetailDelete"
      />
      <EditAgendaModal
        :open="activeModal === 'agendaList'"
        :items="agenda.items.value"
        @close="closeModal"
        @add="onAgendaAdd"
        @edit="onAgendaEdit"
        @delete="onAgendaDelete"
      />
      <AddAgendaItemModal
        :open="activeModal === 'agendaItem'"
        :item="editingItem"
        :items="agenda.items.value"
        @close="closeModal"
        @submit="handleAgendaSave"
        @delete="handleAgendaDelete"
      />
      <EditOurStoryModal
        :open="activeModal === 'ourStoryList'"
        :items="ourStory.items.value"
        @close="closeModal"
        @add="onOurStoryAdd"
        @edit="onOurStoryEdit"
        @delete="onOurStoryDelete"
      />
      <AddOurStoryModal
        :open="activeModal === 'ourStoryItem'"
        :item="editingItem"
        :items="ourStory.items.value"
        @close="closeModal"
        @submit="handleOurStorySave"
        @delete="handleOurStoryDelete"
      />
      <OurStoryUploadModal
        :open="activeModal === 'ourStoryImages'"
        :images="ourStory.images.value"
        @close="closeModal"
        @uploaded="refreshAllData"
      />
      <EditHeroModal
        :open="activeModal === 'hero'"
        :event="backendData?.event"
        @close="closeModal"
        @updated="refreshAllData"
      />
    </template>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { rsvpService } from '@/services/rsvp.service';
import { mediaService } from '@/services/media.service';
import { useInvitationData } from '@/composables/useInvitationData';
import { useScrollReveal } from '@/composables/useScrollReveal';
import { buildLocationAddress, buildMapUrl, formatTimeRange } from '@/utils/invitation';
import HeroSection from '@/components/invitations/wedding/CoastalBreeze/HeroSection.vue';
import ScheduleList from '@/components/invitations/wedding/CoastalBreeze/ScheduleList.vue';
import StoryGallery from '@/components/invitations/wedding/CoastalBreeze/StoryGallery.vue';
import DetailCard from '@/components/invitations/shared/DetailCard.vue';
import CountdownTimer from '@/components/invitations/shared/CountdownTimer.vue';
import RsvpForm from '@/components/invitations/shared/RsvpForm.vue';
import SectionEditButton from '@/components/invitations/shared/SectionEditButton.vue';
import { useInvitationEditMode } from '@/composables/useInvitationEditMode';
import AddAgendaItemModal from '@/components/modals/AddAgendaItemModal.vue';
import AddOurStoryModal from '@/components/modals/AddOurStoryModal.vue';
import EditHeroModal from '@/components/modals/EditHeroModal.vue';
import EditDetailsModal from '@/components/modals/EditDetailsModal.vue';
import AddEventDetailModal from '@/components/modals/AddEventDetailModal.vue';
import EditAgendaModal from '@/components/modals/EditAgendaModal.vue';
import OurStoryUploadModal from '@/components/modals/OurStoryUploadModal.vue';
import EditOurStoryModal from '@/components/modals/EditOurStoryModal.vue';
import { EventDetailTypeSortOrder } from '@/enums/EventDetailType';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { eventId, loading, localized, formatDate, formatTime, fetchData } = useInvitationData();

const {
  isEditMode, activeModal, editingItem,
  openModal, closeModal, refreshCallback, agenda, eventDetails, ourStory,
  handleAgendaSave, handleAgendaDelete,
  handleEventDetailSave, handleEventDetailDelete,
  handleOurStorySave, handleOurStoryDelete,
} = useInvitationEditMode();

const rootRef = ref(null);
const showAgenda = ref(true);
const showOurStory = ref(true);
const isPrivate = computed(() => route.query.isPrivate === 'true');
useScrollReveal(rootRef);

const palette = {
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue200: '#bfdbfe',
  blue400: '#60a5fa',
  rose50: '#fff1f2',
  rose100: '#ffe4e6',
  rose300: '#fda4af',
  gray800: '#1f2937',
};

const fonts = {
  heading: "'Cormorant Garamond', serif",
  body: "'Montserrat', sans-serif",
};

const shadows = {
  card: '0px 4px 20px rgba(0, 0, 0, 0.08)',
  cardHover: '0px 6px 24px rgba(0, 0, 0, 0.12)',
};

const config = reactive({
  brideName: 'Emma',
  groomName: 'Lucas',
  weddingDate: 'Saturday, June 14th, 2025',
  weddingDateTime: '2025-06-14T16:00:00',
  weddingTime: '4:00 PM',
  venue: 'Seaside Garden Estate',
  location: 'Malibu, California',
  heroPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1200&fit=crop',
  heroLabel: "You're Invited",
  ctaLabel: 'RSVP',

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
      config.ceremonyVenue = churchItem.description || '';
      config.ceremonyMapUrl = buildMapUrl(churchItem.location);
    }

    const receptionItem = sorted.find(d => d.type === 'RECEPTION');
    if (receptionItem) {
      config.receptionDate = receptionItem.eventDate || '';
      config.receptionTime = receptionItem.time || '';
      config.receptionVenue = receptionItem.description || '';
      config.receptionMapUrl = buildMapUrl(receptionItem.location);
    }
  }

  // Agenda → schedule timeline
  if (Array.isArray(data.agenda) && data.agenda.length) {
    const sorted = [...data.agenda].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
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

function onDetailsAdd() {
  closeModal();
  openModal('eventDetail');
}

function onDetailsEdit(item) {
  closeModal();
  openModal('eventDetail', item);
}

async function onDetailsDelete(id) {
  await handleEventDetailDelete(id);
}

function onAgendaAdd() {
  closeModal();
  openModal('agendaItem');
}

function onAgendaEdit(item) {
  closeModal();
  openModal('agendaItem', item);
}

async function onAgendaDelete(id) {
  await handleAgendaDelete(id);
  agenda.loadAgenda();
}

function onOurStoryAdd() {
  closeModal();
  openModal('ourStoryItem');
}

function onOurStoryEdit(item) {
  closeModal();
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
    eventDetails.loadEventDetails();
    agenda.loadAgenda();
    ourStory.loadStories();
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
  --font-heading: 'Cormorant Garamond', serif;
  --font-body: 'Montserrat', sans-serif;

  font-family: var(--font-body);
  background: #fff;
  color: #374151;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
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
  border-top-color: #60a5fa;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Sections */
.section {
  padding: 80px 24px;
}

.section--white {
  background: #fff;
}

.section--gray {
  background: #f9fafb;
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
  color: #1f2937;
  margin: 0 0 16px;
}

.section-divider {
  width: 48px;
  height: 1px;
  background: #fda4af;
  margin: 0 auto;
}

/* Details grid */
.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
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
  color: #60a5fa;
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
  background: #fff1f2;
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

/* Responsive */
@media (min-width: 768px) {
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

@media (max-width: 767px) {
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