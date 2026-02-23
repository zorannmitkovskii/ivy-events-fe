<template>
  <div ref="rootRef" class="font-body">
    <div v-if="loading" style="display:flex;align-items:center;justify-content:center;min-height:100vh;">
      <div style="width:40px;height:40px;border:3px solid rgba(0,0,0,0.1);border-top-color:#a78bfa;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
    </div>
    <div v-show="!loading">
    <div data-reveal style="position:relative;">
      <SectionEditButton :visible="isEditMode" :label="t('editSection.hero')" variant="dark" @click="openModal('hero')" />
      <InvitationHero
        :image-url="data.heroImage"
        :couple-name="data.coupleName"
        :date-label="data.dateLabel"
        :location-html="data.locationHtml"
        :map-url="data.heroMapUrl"
        @rsvp-click="scrollToRsvp"
      />
    </div>

    <div data-reveal style="position:relative;">
      <SectionEditButton :visible="isEditMode" :label="t('editSection.details')" @click="openModal('details')" />
      <WeddingDetails
        :countdown-target-iso="data.countdownTargetIso"
        :ceremony-html="data.ceremonyHtml"
        :ceremony-map-url="data.ceremonyMapUrl || data.mapUrl"
        :reception-html="data.receptionHtml"
        :reception-map-url="data.receptionMapUrl || data.mapUrl"
        :venue-html="data.venueHtml"
        :venue-map-url="data.venueMapUrl || data.mapUrl"
      />
    </div>

    <div v-if="showAgenda && !isPrivate" data-reveal style="position:relative;">
      <SectionEditButton :visible="isEditMode" :label="t('editSection.agenda')" @click="openModal('agenda')" />
      <TimelineSection :items="data.timeline" />
    </div>

    <div v-if="showOurStory" data-reveal style="position:relative;">
      <SectionEditButton :visible="isEditMode" :label="t('editSection.ourStory')" @click="openModal('ourStory')" />
      <OurStorySection :left-cards="data.storyCards" :images="data.storyImages" />
    </div>

    <div data-reveal>
      <RSVPSection v-model="rsvp" :respond-by-label="data.respondByLabel" @submit="onSubmitRsvp" />
    </div>

    <!-- Edit Mode Modals -->
    <template v-if="isEditMode">
      <AddAgendaItemModal
        :open="activeModal === 'agenda'"
        :item="editingItem"
        @close="closeModal"
        @submit="handleAgendaSave"
        @delete="handleAgendaDelete"
      />
      <AddOurStoryModal
        :open="activeModal === 'ourStory'"
        :item="editingItem"
        @close="closeModal"
        @submit="handleOurStorySave"
        @delete="handleOurStoryDelete"
      />
      <EditHeroModal
        :open="activeModal === 'hero'"
        :event="backendData?.event"
        @close="closeModal"
        @updated="refreshAllData"
      />
      <EditDetailsModal
        :open="activeModal === 'details'"
        :items="agenda.items.value"
        @close="closeModal"
        @add="onDetailsAdd"
        @edit="onDetailsEdit"
        @delete="onDetailsDelete"
      />
    </template>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { rsvpService } from '@/services/rsvp.service';
import { mediaService } from '@/services/media.service';
import { useInvitationData } from '@/composables/useInvitationData';
import { useScrollReveal } from '@/composables/useScrollReveal';
import { buildLocationAddress, buildMapUrl, formatTimeRange } from '@/utils/invitation';
import InvitationHero from "@/components/invitations/wedding/sunsetGlass/InvitationHero.vue";
import WeddingDetails from "@/components/invitations/wedding/sunsetGlass/WeddingDetails.vue";
import TimelineSection from "@/components/invitations/wedding/sunsetGlass/TimelineSection.vue";
import OurStorySection from "@/components/invitations/wedding/sunsetGlass/OurStorySection.vue";
import RSVPSection from "@/components/invitations/wedding/sunsetGlass/RSVPSection.vue";
import '@/styles/sunsetGlass.css';
import SectionEditButton from '@/components/invitations/shared/SectionEditButton.vue';
import { useInvitationEditMode } from '@/composables/useInvitationEditMode';
import AddAgendaItemModal from '@/components/modals/AddAgendaItemModal.vue';
import AddOurStoryModal from '@/components/modals/AddOurStoryModal.vue';
import EditHeroModal from '@/components/modals/EditHeroModal.vue';
import EditDetailsModal from '@/components/modals/EditDetailsModal.vue';

const { t } = useI18n();
const { eventId: invEventId, loading, localized, formatDate, formatTime, fetchData } = useInvitationData();
const {
  isEditMode, activeModal, editingItem,
  openModal, closeModal, refreshCallback, agenda,
  handleAgendaSave, handleAgendaDelete,
  handleOurStorySave, handleOurStoryDelete,
} = useInvitationEditMode();

const rootRef = ref(null);
const showAgenda = ref(true);
const showOurStory = ref(true);
useScrollReveal(rootRef);

const data = reactive({
  coupleName: "Emily & James",
  dateLabel: "June 15, 2024",
  respondByLabel: "May 1, 2024",
  locationHtml: "Sunset Garden Estate<br>Santa Barbara, California",
  heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1000&fit=crop",

  // For countdown use an ISO datetime (adjust to your real event time/timezone)
  countdownTargetIso: "2026-06-15T16:00:00",

  heroMapUrl: "",
  mapUrl: "https://maps.google.com",
  ceremonyMapUrl: "",
  receptionMapUrl: "",
  venueMapUrl: "",

  ceremonyHtml: "June 15, 2024<br>4:00 PM",
  receptionHtml: "June 15, 2024<br>6:00 PM",
  venueHtml: "Sunset Garden Estate<br>Santa Barbara, CA",

  timeline: [
    { time: "3:30 PM", title: "Guest Arrival", description: "Guests arrive and are seated in the garden ceremony area.", badgeClass: "bg-pink-300" },
    { time: "4:00 PM", title: "Ceremony Begins", description: "The wedding ceremony starts with the processional.", badgeClass: "bg-purple-300" },
    { time: "4:45 PM", title: "Cocktail Hour", description: "Enjoy drinks and hors d'oeuvres on the terrace.", badgeClass: "bg-teal-300" },
    { time: "6:00 PM", title: "Reception & Dinner", description: "Dinner service begins with toasts and speeches.", badgeClass: "bg-pink-300" },
    { time: "8:00 PM", title: "First Dance", description: "The newlyweds share their first dance.", badgeClass: "bg-purple-300" },
    { time: "8:30 PM", title: "Dancing & Celebration", description: "Dance the night away with live music and DJ.", badgeClass: "bg-teal-300" },
  ],

  storyCards: [
    {
      title: "How We Met",
      text: "We met at a coffee shop in downtown Santa Barbara on a rainy afternoon in 2019. James accidentally spilled his latte on Emily's laptop, and the rest is history.",
    },
    {
      title: "The Proposal",
      text: "On a sunset hike at our favorite trail, James got down on one knee overlooking the ocean. She said yes before he could even finish the question!",
    },
  ],

  storyImages: [
    { src: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=500&fit=crop", alt: "Our Story 1", className: "" },
    { src: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=500&fit=crop", alt: "Our Story 2", className: "mt-8" },
    { src: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=500&fit=crop", alt: "Our Story 3", className: "-mt-8" },
    { src: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&h=500&fit=crop", alt: "Our Story 4", className: "" },
  ],
});

const route = useRoute();
const router = useRouter();
const isPrivate = computed(() => route.query.isPrivate === 'true');
const eventId = invEventId;

const rsvp = ref({
  fullNames: [""],
  notificationType: "",
  email: "",
  phone: "",
  attendance: "",
  dietary: "",
  message: "",
});

function applyBackendData(raw) {
  const ev = raw.event;
  if (!ev) return;

  showAgenda.value = ev.showAgenda ?? true;
  showOurStory.value = ev.showOurStory ?? true;

  if (ev.coupleNames?.bride && ev.coupleNames?.groom) {
    data.coupleName = `${ev.coupleNames.bride} & ${ev.coupleNames.groom}`;
  }
  if (ev.heroImageUrl) data.heroImage = ev.heroImageUrl;
  if (ev.date) {
    data.dateLabel = formatDate(ev.date);
    data.countdownTargetIso = ev.date;
  }
  if (ev.rsvpDeadline) data.respondByLabel = formatDate(ev.rsvpDeadline);

  const subtitle = localized(ev.messageI18n, ev.message);
  if (subtitle) data.locationHtml = subtitle;

  if (raw.location) {
    const loc = raw.location;
    const addressParts = [loc.city, loc.country].filter(Boolean).join(', ') || loc.address || '';
    const parts = [loc.venueName, addressParts].filter(Boolean);
    data.locationHtml = parts.join('<br>');

    const mapUrl = buildMapUrl(loc);
    if (mapUrl) {
      data.mapUrl = mapUrl;
      data.heroMapUrl = mapUrl;
    }
  }

  // Agenda → ceremony/reception/venue HTML + timeline
  if (Array.isArray(raw.agenda) && raw.agenda.length) {
    const sorted = [...raw.agenda].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    // Populate ceremony & reception cards from agenda items by type (HTML strings for WeddingDetails)
    const ceremonyTypes = ['CEREMONY', 'CHURCH'];
    const ceremonyItem = sorted.find((a) => ceremonyTypes.includes(a.type));
    if (ceremonyItem) {
      const parts = [
        formatTimeRange(ceremonyItem.startTime, ceremonyItem.endTime),
        buildLocationAddress(ceremonyItem.location) || ceremonyItem.description || '',
      ].filter(Boolean);
      data.ceremonyHtml = parts.join('<br>');
      data.ceremonyMapUrl = buildMapUrl(ceremonyItem.location) || data.mapUrl;
    }

    const receptionItem = sorted.find((a) => a.type === 'RECEPTION');
    if (receptionItem) {
      const parts = [
        formatTimeRange(receptionItem.startTime, receptionItem.endTime),
        buildLocationAddress(receptionItem.location) || receptionItem.description || '',
      ].filter(Boolean);
      data.receptionHtml = parts.join('<br>');
      data.receptionMapUrl = buildMapUrl(receptionItem.location) || data.mapUrl;
    }

    // Venue card from event location
    if (raw.location) {
      const loc = raw.location;
      const venueParts = [loc.venueName, buildLocationAddress(loc) || [loc.city, loc.country].filter(Boolean).join(', ')].filter(Boolean);
      data.venueHtml = venueParts.join('<br>');
      data.venueMapUrl = buildMapUrl(loc) || data.mapUrl;
    }

    // Timeline events
    const badgeClasses = ['bg-pink-300', 'bg-purple-300', 'bg-teal-300'];
    data.timeline = sorted.map((a, i) => ({
      time: a.startTime || '',
      title: a.title || '',
      description: a.description || '',
      badgeClass: badgeClasses[i % 3],
    }));
  }

  // Our Story
  if (Array.isArray(raw.ourStory) && raw.ourStory.length) {
    data.storyCards = raw.ourStory.map((s) => ({
      title: localized(s.titleI18n, s.title),
      text: localized(s.descriptionI18n, s.description),
    }));
    const imgSources = Array.isArray(raw.ourStoryImages) && raw.ourStoryImages.length
      ? raw.ourStoryImages
      : raw.ourStory.filter((s) => s.imageUrl).map((s) => s.imageUrl);
    if (imgSources.length) {
      data.storyImages = imgSources.map((src, i) => ({
        src,
        alt: 'Our Story ' + (i + 1),
        className: i % 2 === 1 ? 'mt-8' : '',
      }));
    }
  }
}

async function loadGalleryImages() {
  if (!invEventId) return;
  try {
    const raw = await mediaService.list(invEventId, { page: 0, size: 30 });
    const items = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : [];
    const imageUrls = items
      .filter((m) => m.fileType?.startsWith('image'))
      .map((m) => m.fileUrl || m.url)
      .filter(Boolean);
    if (!imageUrls.length) return;

    if (!data.heroImage) {
      data.heroImage = imageUrls[0];
    }

    if (!data.storyImages.length) {
      data.storyImages = imageUrls.slice(0, 4).map((src, i) => ({
        src,
        alt: `Photo ${i + 1}`,
        className: i % 2 === 1 ? 'mt-8' : '',
      }));
    }
  } catch (e) {
    console.error('Gallery fetch failed:', e);
  }
}

const backendData = ref(null);

async function refreshAllData() {
  const result = await fetchData();
  if (result) {
    backendData.value = result;
    const defaultHero = data.heroImage;
    const defaultStoryImages = [...data.storyImages];
    data.heroImage = '';
    data.storyImages = [];
    applyBackendData(result);
    await loadGalleryImages();
    if (!data.heroImage) data.heroImage = defaultHero;
    if (!data.storyImages.length) data.storyImages = defaultStoryImages;
  }
}

refreshCallback.value = refreshAllData;

function onDetailsAdd() {
  closeModal();
  openModal('agenda');
}

function onDetailsEdit(item) {
  closeModal();
  openModal('agenda', item);
}

async function onDetailsDelete(id) {
  await handleAgendaDelete(id);
  agenda.loadAgenda();
}

onMounted(async () => {
  await refreshAllData();
  if (isEditMode.value) {
    agenda.loadAgenda();
  }
});

function scrollToRsvp() {
  document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function onSubmitRsvp(payload) {
  if (!eventId) return;
  try {
    await rsvpService.submitRsvp(eventId, payload);
    const names = payload.fullNames || [];
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
