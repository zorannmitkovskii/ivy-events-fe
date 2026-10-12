<template>
  <section
    v-if="guestsTo"
    class="rsvp-next"
    aria-labelledby="rsvp-next-title"
    data-testid="rsvp-next"
  >
    <h2 id="rsvp-next-title" class="rsvp-next-title">{{ t("cpay.publish.rsvp.title") }}</h2>
    <p class="rsvp-next-text">{{ t("cpay.publish.rsvp.where") }}</p>
    <p class="rsvp-next-text">{{ t("cpay.publish.rsvp.empty") }}</p>
    <router-link class="rsvp-next-btn" :to="guestsTo" data-testid="open-guest-list">
      {{ t("cpay.publish.rsvp.openGuests") }}
    </router-link>
    <p class="rsvp-next-who" data-testid="rsvp-who">
      <i class="bi bi-lock" aria-hidden="true"></i>
      {{ t("guests.rsvpEmpty.who") }}
    </p>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { linkedEventId } from "@/services/eventSelection.service";

/**
 * INV-703 — after publishing: where the RSVP replies will appear and a link
 * to the existing guest list (dashboard "Guests") of exactly this event.
 *
 * The link carries `?eventId=`; the router selects that event before the
 * guest page mounts, and only if it is one of the person's events. Nothing
 * here lists guests — that stays the dashboard's job.
 */
const props = defineProps({
  eventId: { type: String, default: "" },
});

const { t } = useI18n();
const route = useRoute();

const guestsTo = computed(() => {
  const id = linkedEventId({ query: { eventId: props.eventId } });
  if (!id) return "";
  return { name: "dashboard.guests", params: { lang: route.params.lang || "mk" }, query: { eventId: id } };
});
</script>

<style scoped>
.rsvp-next {
  margin: 20px 0 0;
  padding: 16px;
  border: 1px solid var(--neutral-300, #ccc);
  border-radius: 12px;
  background: #fafafa;
  text-align: left;
}
.rsvp-next-title { font-size: 16px; font-weight: 700; color: var(--neutral-900, #1a1a1a); margin: 0 0 8px; }
.rsvp-next-text { font-size: 13px; color: #4a4a4a; margin: 0 0 8px; overflow-wrap: anywhere; }
.rsvp-next-btn {
  display: block;
  margin: 12px 0;
  padding: 12px;
  min-height: 44px;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid var(--neutral-900, #1a1a1a);
  background: #fff;
  color: var(--neutral-900, #1a1a1a);
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}
.rsvp-next-btn:focus-visible { outline: 3px solid var(--neutral-900, #1a1a1a); outline-offset: 2px; }
.rsvp-next-who { font-size: 12px; color: #5f5f5f; margin: 0; overflow-wrap: anywhere; }
</style>
