<template>
  <div ref="rootRef" class="modern-collage">
    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <div v-show="!loading">

      <!-- ENTRY OVERLAY -->
      <div v-if="showEntry" class="entry-overlay" :class="{ 'entry-fading': entryFading }">
        <div class="collage-grid" :class="{ 'collage-zooming': collageZooming }">
          <div
            v-for="(photo, i) in config.collagePhotos"
            :key="i"
            class="collage-item"
            @click="enterSite"
          >
            <img :src="photo.url" :alt="photo.alt" loading="eager" />
          </div>
        </div>

        <div class="entry-card" :class="{ 'entry-card-fading': collageZooming }">
          <h1 class="entry-names">{{ config.brideName }} & {{ config.groomName }}</h1>
          <p class="entry-date">{{ config.weddingDate }}</p>
          <div class="entry-bounce">
            <p class="entry-hint">{{ t('invitation.tapToEnter') }}</p>
          </div>
        </div>
      </div>

      <!-- HERO SECTION -->
      <section v-show="!showEntry" class="hero-section" data-reveal>
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
      <section v-show="!showEntry" id="details-section" class="section section--cream" data-reveal>
        <div class="section-inner">
          <div class="section-header">
            <h2 class="section-title">{{ t('invitation.countingDown') }}</h2>
          </div>

          <div class="countdown-wrap">
            <CountdownTimer
              :target-date="config.weddingDateTime"
              :show-seconds="false"
              :colors="[palette.rose600, palette.rose600]"
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
              <h3 class="detail-title">{{ t('invitation.theCeremony') }}</h3>
              <p class="detail-time">{{ config.ceremonyTime }}</p>
              <p class="detail-address" v-html="config.ceremonyAddress"></p>
              <a v-if="config.ceremonyMapUrl" :href="config.ceremonyMapUrl" target="_blank" rel="noopener" class="detail-map-link detail-map-link--rose">{{ t('invitation.getDirections') }}</a>
            </div>

            <!-- Reception Card -->
            <div class="detail-card detail-card--stone">
              <div class="detail-icon detail-icon--stone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-1-3.5-1-3.5H8S7 8 7 10a5 5 0 0 0 5 5z"/><path d="M12 10V2"/>
                </svg>
              </div>
              <h3 class="detail-title">{{ t('invitation.theReception') }}</h3>
              <p class="detail-time">{{ config.receptionTime }}</p>
              <p class="detail-address" v-html="config.receptionAddress"></p>
              <a v-if="config.receptionMapUrl" :href="config.receptionMapUrl" target="_blank" rel="noopener" class="detail-map-link detail-map-link--stone">{{ t('invitation.getDirections') }}</a>
            </div>
          </div>

          <!-- Dress Code -->
          <div v-if="config.dressCode" class="dress-code">
            <span class="dress-label">{{ t('invitation.dressCode') }}:</span>
            <span class="dress-value">{{ config.dressCode }}</span>
          </div>
        </div>
      </section>

      <!-- AGENDA SECTION -->
      <section v-show="!showEntry" id="agenda-section" class="section section--white" data-reveal>
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
      <section v-show="!showEntry" id="story-section" class="section section--cream" data-reveal>
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
      <section v-show="!showEntry" id="rsvp-section" class="section section--dark" data-reveal>
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
            :accent-color="palette.rose500"
            :accept-color="palette.rose200"
            :decline-color="palette.stone300"
            :button-bg="palette.rose600"
            button-text="#fff"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            border-radius="4px"
            @submit="onRsvpSubmit"
          />
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { rsvpService } from '@/services/rsvp.service';
import { mediaService } from '@/services/media.service';
import { useInvitationData } from '@/composables/useInvitationData';
import { useScrollReveal } from '@/composables/useScrollReveal';
import { buildLocationAddress, buildMapUrl, formatTimeRange } from '@/utils/invitation';
import CountdownTimer from '@/components/invitations/shared/CountdownTimer.vue';
import EventTimeline from '@/components/invitations/shared/EventTimeline.vue';
import RsvpForm from '@/components/invitations/shared/RsvpForm.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { eventId, loading, localized, formatDate, formatTime, fetchData } = useInvitationData();

const rootRef = ref(null);
const showEntry = ref(true);
const collageZooming = ref(false);
const entryFading = ref(false);

useScrollReveal(rootRef);

const palette = {
  rose50: '#fff1f2',
  rose100: '#ffe4e6',
  rose200: '#fecdd3',
  rose300: '#fda4af',
  rose400: '#fb7185',
  rose500: '#f43f5e',
  rose600: '#e11d48',
  rose700: '#be123c',
  stone50: '#fafaf9',
  stone100: '#f5f5f4',
  stone200: '#e7e5e4',
  stone300: '#d6d3d1',
  stone400: '#a8a29e',
  stone500: '#78716c',
  stone600: '#57534e',
  stone800: '#292524',
  stone900: '#1c1917',
  stone950: '#0c0a09',
};

const fonts = {
  heading: "'Playfair Display', serif",
  body: "'Lato', sans-serif",
};

const config = reactive({
  brideName: 'Sarah',
  groomName: 'James',
  weddingDate: 'October 14, 2024',
  weddingDateTime: '2024-10-14T15:00:00',
  inviteText: "We're getting married!",
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

  ceremonyTime: '3:00 PM',
  ceremonyAddress: 'St. Helena Catholic Church<br>1340 Tainter St<br>St Helena, CA 94574',
  ceremonyMapUrl: '#',
  receptionTime: '5:30 PM - Midnight',
  receptionAddress: 'Beringer Vineyards<br>2000 Main St<br>St Helena, CA 94574',
  receptionMapUrl: '#',
  dressCode: 'Formal / Black Tie Optional',

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

  rsvpDeadline: 'September 1st, 2024',
});

function enterSite() {
  collageZooming.value = true;
  setTimeout(() => {
    entryFading.value = true;
    setTimeout(() => {
      showEntry.value = false;
    }, 800);
  }, 600);
}

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
    config.heroMapUrl = buildMapUrl(loc);
  }

  // Map agenda items to detail cards and timeline
  if (Array.isArray(data.agenda) && data.agenda.length) {
    const sorted = [...data.agenda].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    // Populate ceremony & reception cards from agenda items by type
    const ceremonyTypes = ['CEREMONY', 'CHURCH'];
    const ceremonyItem = sorted.find((a) => ceremonyTypes.includes(a.type));
    if (ceremonyItem) {
      config.ceremonyTime = formatTimeRange(ceremonyItem.startTime, ceremonyItem.endTime);
      config.ceremonyAddress = buildLocationAddress(ceremonyItem.location)
        || ceremonyItem.description || '';
      config.ceremonyMapUrl = buildMapUrl(ceremonyItem.location);
    }

    const receptionItem = sorted.find((a) => a.type === 'RECEPTION');
    if (receptionItem) {
      config.receptionTime = formatTimeRange(receptionItem.startTime, receptionItem.endTime);
      config.receptionAddress = buildLocationAddress(receptionItem.location)
        || receptionItem.description || '';
      config.receptionMapUrl = buildMapUrl(receptionItem.location);
    }

    // Timeline events
    config.agendaEvents = sorted.map((a) => ({
      time: formatTimeRange(a.startTime, a.endTime),
      title: a.title || '',
      subtitle: a.description || '',
    }));
  }

  if (Array.isArray(data.ourStory) && data.ourStory.length) {
    const ourStoryImages = Array.isArray(data.ourStoryImages) ? data.ourStoryImages : [];
    config.stories = data.ourStory.map((s, i) => ({
      title: localized(s.titleI18n, s.title),
      text: localized(s.descriptionI18n, s.description),
      date: s.date || '',
      imageUrl: ourStoryImages[i] || s.imageUrl || '',
    }));
    const allImages = config.stories.map(s => s.imageUrl).filter(Boolean);
    if (allImages.length) {
      config.collagePhotos = allImages.map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
    }
  }

  if (ev.rsvpDeadline) config.rsvpDeadline = formatDate(ev.rsvpDeadline);
  if (ev.dressCode) config.dressCode = ev.dressCode;
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

  const data = await fetchData();
  if (data) {
    // Clear default placeholder images so backend / gallery can take over
    config.heroPhotoUrl = '';
    config.collagePhotos = [];
    applyBackendData(data);
    await loadGalleryImages();
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
.modern-collage {
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Lato', sans-serif;

  font-family: var(--font-body);
  background: #fafaf9;
  color: #292524;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* Loading */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #fafaf9;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #e11d48;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ========== ENTRY OVERLAY ========== */
.entry-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: #1c1917;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.8s ease;
}
.entry-overlay.entry-fading {
  opacity: 0;
  pointer-events: none;
}

.collage-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4px;
  padding: 4px;
  background: #f5f5f4;
  transition: transform 0.8s ease-in-out, opacity 0.8s ease;
}
.collage-grid.collage-zooming {
  transform: scale(1.5);
  opacity: 0;
}

@media (min-width: 768px) {
  .collage-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 8px;
    padding: 8px;
  }
}

.collage-item {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
  background: #e7e5e4;
  transition: transform 0.5s ease, filter 0.5s ease;
}
.collage-item:hover {
  transform: scale(1.03);
  filter: brightness(1.1);
  z-index: 10;
}
.collage-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.entry-card {
  position: absolute;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  box-shadow: 0 4px 20px -2px rgba(150, 140, 130, 0.1);
  max-width: 420px;
  margin: 0 16px;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.entry-card-fading {
  opacity: 0;
}
.entry-names {
  font-family: var(--font-heading);
  font-size: 40px;
  color: #1c1917;
  margin: 0 0 8px;
  letter-spacing: 0.5px;
}
.entry-date {
  font-family: var(--font-body);
  font-size: 18px;
  color: #57534e;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 24px;
}
.entry-bounce {
  animation: bounce-entry 2s ease infinite;
}
.entry-hint {
  font-family: var(--font-body);
  font-size: 14px;
  color: #78716c;
  font-style: italic;
  margin: 0;
}
@keyframes bounce-entry {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@media (min-width: 768px) {
  .entry-names { font-size: 48px; }
}

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
  color: #1c1917;
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

@media (min-width: 640px) {
  .hero-names { font-size: 72px; }
  .hero-subtitle { font-size: 24px; }
  .hero-actions { flex-direction: row; justify-content: center; }
}
@media (min-width: 1024px) {
  .hero-names { font-size: 88px; }
}

/* ========== SECTIONS ========== */
.section {
  padding: 96px 24px;
}
.section--cream { background: #fafaf9; }
.section--white { background: #fff; }
.section--dark { background: #1c1917; color: #fff; position: relative; overflow: hidden; }
.section-inner { max-width: 1200px; margin: 0 auto; }
.section-inner--narrow { max-width: 700px; }
.section-header { text-align: center; margin-bottom: 64px; }
.section-title {
  font-family: var(--font-heading);
  font-size: 36px;
  font-weight: 400;
  color: #292524;
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
  background: #fda4af;
  margin: 0 auto;
  border-radius: 99px;
}

@media (min-width: 768px) {
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
  gap: 32px;
  max-width: 900px;
  margin: 0 auto;
}
@media (min-width: 768px) {
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
.detail-card--rose { border-top: 4px solid #fda4af; }
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
.detail-icon--rose { background: #fff1f2; color: #e11d48; }
.detail-icon--stone { background: #f5f5f4; color: #57534e; }

.detail-title {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 400;
  color: #292524;
  margin: 0 0 8px;
}
.detail-time {
  font-size: 16px;
  font-weight: 700;
  color: #78716c;
  margin: 0 0 24px;
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
.detail-map-link--rose { color: #e11d48; }
.detail-map-link--rose:hover { color: #be123c; }
.detail-map-link--stone { color: #57534e; }
.detail-map-link--stone:hover { color: #292524; }

.dress-code {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}
.dress-code > * {
  display: inline;
}
.dress-label {
  font-family: var(--font-heading);
  font-size: 18px;
  color: #292524;
  margin-right: 8px;
}
.dress-value {
  font-size: 16px;
  color: #57534e;
}

/* ========== STORY ========== */
.story-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}
@media (min-width: 768px) {
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
  background: #fff1f2;
  color: #e11d48;
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
  color: #292524;
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

/* ========== RESPONSIVE ========== */
@media (max-width: 767px) {
  .section { padding: 64px 16px; }
  .entry-names { font-size: 32px; }
  .entry-card { padding: 24px 20px; }
}
</style>
