<template>
  <div class="wedding-invitation">
    <!-- Envelope Opening Animation -->
    <EnvelopeOpening
      v-if="showEnvelope"
      @opened="onEnvelopeOpened"
      :envelope-text="config.envelopeText"
    />

    <!-- Main Invitation Content -->
    <transition name="fade">
      <div v-if="!showEnvelope" class="invitation-wrapper">
        <div class="invitation-container">

          <!-- Couple Photo Section -->
          <CouplePhotoSection
            :intro="config.coupleIntro"
            :photo-url="config.couplePhotoUrl"
          />

          <!-- Save the Date Header -->
          <DateSave
            :bride-name="config.brideName"
            :groom-name="config.groomName"
            :wedding-date="config.weddingDate"
          />

          <!-- Photo Gallery -->
          <PhotoGallery :photos="config.galleryPhotos" />

          <!-- Wedding Details -->
          <WeddingDetails
            :date="config.weddingDate"
            :time="config.ceremonyTime"
            :venue="config.venueName"
            :address="config.venueAddress"
          />

          <!-- Map Location -->
          <MapLocation
            :venue="config.venueName"
            :latitude="config.latitude"
            :longitude="config.longitude"
          />

          <!-- Timeline of Events -->
          <EventTimeline :events="config.timelineEvents" />

          <!-- RSVP Form -->
          <RsvpForm
            :max-responses="999"
            @submit="handleRsvpSubmit"
          />

        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import MapLocation from "@/components/invitations/wedding/InvitationOne/MapLocation.vue";
import RsvpForm from "@/components/invitations/wedding/InvitationOne/RsvpForm.vue";
import EventTimeline from "@/components/invitations/wedding/InvitationOne/EventTimeline.vue";
import WeddingDetails from "@/components/invitations/wedding/InvitationOne/WeddingDetails.vue";
import PhotoGallery from "@/components/invitations/wedding/InvitationOne/PhotoGallery.vue";
import CouplePhotoSection
  from "@/components/invitations/wedding/InvitationOne/CouplePhotoSection.vue";
import EnvelopeOpening from "@/components/invitations/wedding/InvitationOne/EnvelopeOpening.vue";
import DateSave from "@/components/invitations/wedding/InvitationOne/DateSave.vue";

const route = useRoute();
const showEnvelope = ref(true);

// Wedding configuration
const config = reactive({
  envelopeText: 'Click to open',
  brideName: 'Emma',
  groomName: 'Michael',
  coupleIntro: 'Two hearts, one beautiful journey. Join us as we celebrate our love and commitment to each other.',
  couplePhotoUrl: null,
  weddingDate: 'Saturday, June 15, 2025',
  ceremonyTime: '4:00 PM',
  venueName: 'The Grand Garden Estate',
  venueAddress: '123 Romantic Lane, Love City',
  latitude: 41.9981,
  longitude: 21.4254,
  galleryPhotos: [],
  timelineEvents: [
    { time: '4:00 PM', title: 'Ceremony begins' },
    { time: '5:00 PM', title: 'Cocktails & Canapés' },
    { time: '6:00 PM', title: 'Dinner & Dancing' },
    { time: '9:00 PM', title: 'Late Night Celebration' }
  ]
});

function onEnvelopeOpened() {
  setTimeout(() => {
    showEnvelope.value = false;
  }, 1000);
}

async function handleRsvpSubmit(rsvpData) {
  // TODO: Integrate with your backend API
  console.log('RSVP submitted:', rsvpData);

  // Example API call:
  // const response = await fetch('/api/rsvp', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(rsvpData)
  // });
  // return response.ok;

  return true; // Mock success
}

// Load wedding data from route params or API
onMounted(async () => {
  const invitationId = route.params.invitationId;
  if (invitationId) {
    // TODO: Load wedding data from API
    // const data = await loadWeddingData(invitationId);
    // Object.assign(config, data);
  }
});
</script>

<style scoped>
.wedding-invitation {
  min-height: 100vh;
  background: linear-gradient(135deg, #e8f4f8 0%, #d4e8f0 50%, #e8f4f8 100%);
}

.invitation-wrapper {
  width: 100%;
  min-height: 100vh;
  overflow-y: auto;
}

.invitation-container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 60px 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
