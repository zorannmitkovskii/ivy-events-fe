<template>
  <div class="parisian-wedding">
    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <div v-show="!loading">
    <!-- Hero -->
    <HeroSection
      :bride-name="config.brideName"
      :groom-name="config.groomName"
      :wedding-date="config.weddingDate"
      :invite-text="config.inviteText"
      :location="config.location"
      :map-url="config.heroMapUrl"
      :photo-url="config.heroPhotoUrl"
      :cta-label="config.ctaLabel"
    />

    <!-- Details Section -->
    <section class="section section--blush">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">The Details</h2>
          <p class="section-subtitle">A celebration of love in the City of Light</p>
        </div>

        <div class="details-grid">
          <!-- Ceremony Card -->
          <div class="detail-card group">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M18 21V8a6 6 0 0 0-12 0v13" />
                <path d="M2 21h20" />
                <path d="M12 2v4" />
                <path d="M10 12h4" />
              </svg>
            </div>
            <h3 class="card-title">The Ceremony</h3>
            <p class="card-time">{{ config.ceremonyTime }}</p>
            <p class="card-address" v-html="config.ceremonyAddress"></p>
            <a v-if="config.ceremonyMapUrl" :href="config.ceremonyMapUrl" target="_blank" rel="noopener" class="card-map-link">View Map</a>
          </div>

          <!-- Reception Card -->
          <div class="detail-card group">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M8 22h8" />
                <path d="M7 10h10" />
                <path d="M12 15v7" />
                <path d="M12 15a5 5 0 0 0 5-5c0-2-1-3.5-1-3.5H8S7 8 7 10a5 5 0 0 0 5 5z" />
                <path d="M12 10V2" />
              </svg>
            </div>
            <h3 class="card-title">The Reception</h3>
            <p class="card-time">{{ config.receptionTime }}</p>
            <p class="card-address" v-html="config.receptionAddress"></p>
            <a v-if="config.receptionMapUrl" :href="config.receptionMapUrl" target="_blank" rel="noopener" class="card-map-link">View Map</a>
          </div>

          <!-- Countdown Card -->
          <div class="countdown-card">
            <h3 class="countdown-heading">Countdown</h3>
            <CountdownTimer
              :target-date="config.weddingDateTime"
              :show-seconds="false"
              separator=":"
              :colors="[palette.neutral800, palette.neutral800]"
              separator-color="#6b7280"
              :heading-font="fonts.heading"
              :body-font="fonts.body"
              unit-label-color="#6b7280"
            />
            <p class="countdown-tagline">Until we say "I do"</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Our Story -->
    <section class="section section--white">
      <div class="section-inner">
        <OurStorySection
          :title="config.storyTitle"
          :paragraphs="config.storyParagraphs"
          :image-url="config.storyImageUrl"
          :signature-url="config.signatureUrl"
          :accent-color="palette.champagne300"
          :heading-font="fonts.heading"
          :body-font="fonts.body"
        />
      </div>
    </section>

    <!-- Agenda Timeline -->
    <section class="section section--champagne">
      <div class="section-inner">
        <AgendaTimeline
          :title="config.agendaTitle"
          :events="config.agendaEvents"
          :line-color="palette.champagne300"
          :badge-bg="palette.champagne100"
          :badge-text="palette.champagne800"
          :dot-border="palette.champagne300"
          :icon-color="palette.champagne600"
          :heading-font="fonts.heading"
          :body-font="fonts.body"
        >
          <template #icon-0>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
          </template>
          <template #icon-1>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </template>
          <template #icon-2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </template>
          <template #icon-3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </template>
        </AgendaTimeline>
      </div>
    </section>

    <!-- RSVP -->
    <section id="rsvp-section" class="section section--white">
      <div class="section-inner section-inner--narrow">
        <div class="rsvp-wrapper">
          <RsvpForm
            title="R.S.V.P."
            :subtitle="'Kindly respond by ' + config.rsvpDeadline"
            name-label="Guest Name"
            name-placeholder="First & Last Name"
            add-guest-label="Add another guest"
            accept-label="Joyfully Accepts"
            decline-label="Regretfully Declines"
            message-label="Message to the Couple"
            message-placeholder="Dietary restrictions or well wishes..."
            submit-label="Submit Response"
            :accent-color="palette.champagne500"
            :accept-color="palette.champagne300"
            :decline-color="palette.blush300"
            :button-bg="palette.neutral800"
            button-text="#fff"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            border-radius="2px"
            @submit="onRsvpSubmit"
          />
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <p class="footer-text">{{ config.brideName.charAt(0) }} & {{ config.groomName.charAt(0) }} &copy; 2024</p>
    </footer>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { rsvpService } from '@/services/rsvp.service';
import { useInvitationData } from '@/composables/useInvitationData';
import HeroSection from '@/components/invitations/wedding/ParisianWedding/HeroSection.vue';
import OurStorySection from '@/components/invitations/wedding/ParisianWedding/OurStorySection.vue';
import AgendaTimeline from '@/components/invitations/wedding/ParisianWedding/AgendaTimeline.vue';
import CountdownTimer from '@/components/invitations/shared/CountdownTimer.vue';
import RsvpForm from '@/components/invitations/shared/RsvpForm.vue';

const route = useRoute();
const router = useRouter();
const { eventId, loading, localized, formatDate, formatTime, fetchData } = useInvitationData();

const palette = {
  blush50: '#fdf2f2',
  blush200: '#f9d2d2',
  blush300: '#f2aeb1',
  champagne50: '#fbf9f3',
  champagne100: '#f6f1e3',
  champagne200: '#ebe0c3',
  champagne300: '#dec69a',
  champagne500: '#c59053',
  champagne600: '#b97645',
  champagne800: '#7f4d36',
  lavender50: '#f6f5f9',
  lavender200: '#dedbe8',
  neutral800: '#1f2937',
};

const fonts = {
  heading: "'Playfair Display', serif",
  body: "'Cormorant Garamond', serif",
};

const config = reactive({
  brideName: 'Chloe',
  groomName: 'Alexandre',
  weddingDate: 'June 24th, 2024',
  weddingDateTime: '2024-06-24T15:00:00',
  inviteText: 'You are invited to the wedding of',
  location: 'Paris, France',
  heroMapUrl: '',
  ctaLabel: 'RSVP',
  heroPhotoUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=2070&q=80',

  ceremonyTime: '3:00 PM',
  ceremonyAddress: 'Saint-&Eacute;tienne-du-Mont<br>Place Sainte-Genevi&egrave;ve<br>75005 Paris',
  ceremonyMapUrl: '#',
  receptionTime: '6:00 PM',
  receptionAddress: 'Le Pavillon des Canaux<br>39 Quai de la Loire<br>75019 Paris',
  receptionMapUrl: '#',

  storyTitle: 'Our Story',
  storyParagraphs: [
    'It began with a chance encounter at a small caf\u00e9 in Montmartre. A shared table, a spilled espresso, and a conversation that lasted until the streetlights flickered on.',
    'Three years later, under the golden glow of the Eiffel Tower, Alexandre asked the question that would change our lives forever. We are thrilled to invite you back to the city where our hearts first met.',
  ],
  storyImageUrl: 'https://images.unsplash.com/photo-1522673607200-1645062cd958?w=2070&q=80',
  signatureUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=687&q=80',

  agendaTitle: 'The Agenda',
  agendaEvents: [
    { time: '2:00 PM', title: 'Welcome Drinks', venue: 'Le Bar Parisien', description: 'Guests arrive and enjoy light refreshments before the ceremony begins.' },
    { time: '3:00 PM', title: 'Ceremony', venue: 'The Chapel', description: 'We exchange vows in an intimate ceremony surrounded by loved ones.' },
    { time: '4:30 PM', title: 'Cocktail Hour', venue: 'Garden Terrace', description: "Live jazz, champagne, and hors d'oeuvres in the garden." },
    { time: '6:30 PM', title: 'Dinner & Dancing', venue: 'Grand Ballroom', description: 'A three-course French dinner followed by dancing until midnight.' },
  ],

  rsvpDeadline: 'May 1st',
});

function applyBackendData(data) {
  const ev = data.event;
  if (!ev) return;

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
    const mapUrl = loc.mapUrl
      || (loc.latitude != null && loc.longitude != null
        ? `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`
        : '');
    if (mapUrl) config.heroMapUrl = mapUrl;
  }

  // Wedding details → ceremony/reception
  if (Array.isArray(data.weddingDetails) && data.weddingDetails.length) {
    const sorted = [...data.weddingDetails].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    sorted.forEach((d) => {
      const title = localized(d.titleI18n, d.title);
      const desc = localized(d.descriptionI18n, d.description);
      if (d.icon === 'church' || title?.toLowerCase().includes('ceremon')) {
        if (d.startTime) config.ceremonyTime = d.startTime;
        if (desc) config.ceremonyAddress = desc;
        if (d.location?.mapUrl) config.ceremonyMapUrl = d.location.mapUrl;
      } else if (d.icon === 'party' || title?.toLowerCase().includes('recept')) {
        if (d.startTime) config.receptionTime = d.startTime;
        if (desc) config.receptionAddress = desc;
        if (d.location?.mapUrl) config.receptionMapUrl = d.location.mapUrl;
      }
    });
  }

  // Agenda
  if (Array.isArray(data.agenda) && data.agenda.length) {
    config.agendaEvents = [...data.agenda]
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((a) => ({
        time: a.startTime || '',
        title: localized(a.titleI18n, a.title),
        venue: localized(a.descriptionI18n, a.description),
        description: localized(a.descriptionI18n, a.description),
      }));
  }

  // Our Story → paragraphs
  if (Array.isArray(data.ourStory) && data.ourStory.length) {
    config.storyParagraphs = data.ourStory.map((s) =>
      localized(s.descriptionI18n, s.description)
    );
    if (Array.isArray(data.ourStoryImages) && data.ourStoryImages.length) {
      config.storyImageUrl = data.ourStoryImages[0];
    } else {
      const firstImg = data.ourStory.find((s) => s.imageUrl);
      if (firstImg) config.storyImageUrl = firstImg.imageUrl;
    }
  }

  if (ev.rsvpDeadline) config.rsvpDeadline = formatDate(ev.rsvpDeadline);
}

onMounted(async () => {
  const fontLinks = [
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap',
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap',
  ];
  fontLinks.forEach(href => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  });

  const data = await fetchData();
  if (data) applyBackendData(data);
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
.parisian-wedding {
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Cormorant Garamond', serif;

  font-family: var(--font-body);
  background: #fdf2f2;
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
  background: #fdf2f2;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #dec69a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Sections */
.section {
  padding: 96px 24px;
}

.section--blush {
  background: #fdf2f2;
}

.section--white {
  background: #fff;
}

.section--champagne {
  background: #fbf9f3;
}

.section-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.section-inner--narrow {
  max-width: 700px;
}

.section-header {
  text-align: center;
  margin-bottom: 64px;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 48px;
  font-weight: 400;
  color: #1f2937;
  margin: 0 0 16px;
}

.section-subtitle {
  font-family: var(--font-body);
  font-size: 20px;
  font-style: italic;
  color: #6b7280;
  margin: 0;
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

.detail-card {
  background: #fff;
  padding: 40px;
  text-align: center;
  border: 1px solid #ebe0c3;
  border-radius: 4px;
  box-shadow: 0 4px 20px -2px rgba(120, 100, 100, 0.1);
  transition: box-shadow 0.5s ease;
}

.detail-card:hover {
  box-shadow: 0 10px 25px -5px rgba(120, 100, 100, 0.15);
}

.card-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 24px;
  color: #c59053;
  transition: transform 0.5s ease;
}

.group:hover .card-icon {
  transform: scale(1.1);
}

.card-icon svg {
  width: 100%;
  height: 100%;
}

.card-title {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 400;
  color: #1f2937;
  margin: 0 0 8px;
}

.card-time {
  font-family: var(--font-body);
  font-size: 18px;
  color: #4b5563;
  margin: 0 0 16px;
}

.card-address {
  font-family: var(--font-body);
  font-size: 16px;
  color: #6b7280;
  margin: 0 0 24px;
  line-height: 1.7;
}

.card-map-link {
  display: inline-block;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #b97645;
  border-bottom: 1px solid #dec69a;
  padding-bottom: 4px;
  text-decoration: none;
  transition: color 0.3s ease;
}

.card-map-link:hover {
  color: #7f4d36;
}

/* Countdown Card */
.countdown-card {
  background: #f6f5f9;
  padding: 40px;
  text-align: center;
  border: 1px solid #dedbe8;
  border-radius: 4px;
  box-shadow: 0 4px 20px -2px rgba(120, 100, 100, 0.1);
  transition: box-shadow 0.5s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.countdown-card:hover {
  box-shadow: 0 10px 25px -5px rgba(120, 100, 100, 0.15);
}

.countdown-heading {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 400;
  color: #1f2937;
  margin: 0 0 24px;
}

.countdown-tagline {
  font-family: var(--font-body);
  font-style: italic;
  font-size: 16px;
  color: #6b7280;
  margin: 32px 0 0;
}

/* RSVP Wrapper */
.rsvp-wrapper {
  background: #fdf2f2;
  padding: 32px 32px;
  border-radius: 4px;
  border: 1px solid #f9d2d2;
  box-shadow: 0 4px 20px -2px rgba(120, 100, 100, 0.1);
}

/* Footer */
.footer {
  background: #fff;
  padding: 32px 24px;
  text-align: center;
}

.footer-text {
  font-family: var(--font-heading);
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

/* Responsive */
@media (min-width: 768px) {
  .details-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .rsvp-wrapper {
    padding: 48px;
  }
}

@media (max-width: 767px) {
  .section {
    padding: 64px 16px;
  }

  .section-title {
    font-size: 36px;
  }

  .details-grid {
    max-width: 440px;
    margin: 0 auto;
  }

  .detail-card,
  .countdown-card {
    padding: 32px 24px;
  }
}
</style>
