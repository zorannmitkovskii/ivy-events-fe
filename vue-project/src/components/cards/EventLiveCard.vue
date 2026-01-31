<template>
  <section class="page">
    <div class="card">
      <StatusHeroBanner />

      <div class="card__body">
        <h1 class="title">
          {{ title }}
          <span class="title__emoji" aria-hidden="true">🎉</span>
        </h1>

        <p class="subtitle">{{ subtitle }}</p>

        <EventMiniCard
          :image="event.image"
          :title="event.title"
          :dateText="event.dateText"
          :statusText="event.statusText"
         :date-range="event.startDate" status="ACTIVE"/>

        <div class="actions">
          <ButtonMain
            class="w-full"
            :to="shareTo"
            variant="main"
          >
            <span class="btn-ico" aria-hidden="true">🔗</span>
            {{ shareLabel }}
          </ButtonMain>

          <!-- Secondary (sage) -->
          <ButtonMain
            class="w-full btn-sage"
            :to="rsvpTo"
            variant="outline"
          >
            <span class="btn-ico" aria-hidden="true">✉️</span>
            {{ rsvpLabel }}
          </ButtonMain>
        </div>

        <DividerRow />

        <RouterLink class="link" :to="overviewTo">
          {{ overviewLabel }} <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </div>

    <p>
      {{ footerText }}
      <RouterLink class="footer__link" :to="editTo">{{ footerLinkLabel }}</RouterLink>
    </p>
  </section>
</template>

<script setup>
import { RouterLink } from "vue-router";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import EventMiniCard from "@/components/cards/EventMiniCard.vue";
import DividerRow from "@/components/ui/DividerRow.vue";
import StatusHeroBanner from "@/components/onboarding/StatusHeroBanner.vue";

defineProps({
  title: { type: String, default: "Your Event Is Live" },
  subtitle: {
    type: String,
    default:
      "Congratulations! Your event has been successfully published and is now visible to attendees."
  },

  event: {
    type: Object,
    required: true
    // { image, title, dateText, statusText }
  },

  shareTo: { type: [String, Object], default: "/event/share" },
  rsvpTo: { type: [String, Object], default: "/event/rsvp" },
  overviewTo: { type: [String, Object], default: "/event" },
  editTo: { type: [String, Object], default: "/event/edit" },

  shareLabel: { type: String, default: "Share Invitation" },
  rsvpLabel: { type: String, default: "Send RSVP Email" },
  overviewLabel: { type: String, default: "Go to Event Overview" },

  footerText: { type: String, default: "Need to make changes?" },
  footerLinkLabel: { type: String, default: "Edit event details" }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 48px 18px;
  background: var(--bg-main);
}

.card {
  width: min(520px, 100%);
  background: var(--bg-white);
  border-radius: 18px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.06);
}

.card__body {
  padding: 34px 26px 20px;
  display: grid;
  gap: 16px;
  text-align: center;
}

.title {
  margin: 0;
  font-size: 30px;
  line-height: 1.15;
  color: var(--neutral-900);
  font-weight: 800;
}

.title__emoji {
  margin-left: 8px;
}

.subtitle {
  margin: 0 auto;
  max-width: 38ch;
  color: var(--neutral-700);
  font-size: 14px;
  line-height: 1.6;
}

.actions {
  display: grid;
  gap: 10px;
  margin-top: 6px;
}

.w-full {
  width: 100%;
}

.btn-ico {
  display: inline-flex;
  align-items: center;
}

/* Make second button look like sage-filled like the screenshot */
.btn-sage :deep(.btn) {
  /* if your ButtonMain is scoped, this helps when used in parent,
     otherwise you can just apply a class in ButtonMain itself */
}

.btn-sage {
  background: var(--brand-light) !important;
  border-color: var(--brand-light) !important;
  color: var(--brand-main) !important;
}

.btn-sage:hover {
  background: var(--brand-main) !important; /* slightly darker sage */
  border-color: var(--brand-main) !important;
  color: var(--bg-white) !important;
  transform: translateY(-2px);
}

.link {
  text-decoration: none;
  color: var(--neutral-700);
  font-weight: 600;
  font-size: 13px;
  padding: 6px 0;
}

.link:hover {
  color: var(--brand-main);
}

.footer {
  margin: 14px 0 0;
  color: var(--neutral-700);
  font-size: 13px;
}

.footer__link {
  margin-left: 6px;
  color: var(--brand-gold);
  font-weight: 700;
  text-decoration: none;
}

.footer__link:hover {
  text-decoration: underline;
}
</style>
