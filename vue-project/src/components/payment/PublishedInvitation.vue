<template>
  <section class="published" data-testid="publish-success">
    <p class="published-status">
      <span class="status-pill" data-testid="publish-status">
        <span aria-hidden="true">✓</span>
        {{ t("cpay.publish.status") }}: {{ t("cpay.publish.live") }}
      </span>
    </p>

    <template v-if="publicUrl">
      <label id="published-link-label" class="link-label" for="published-link">
        {{ t("cpay.publish.linkLabel") }}
      </label>
      <input
        id="published-link"
        class="link-field"
        type="url"
        readonly
        :value="publicUrl"
        aria-describedby="published-link-hint"
        data-testid="public-url"
        @focus="$event.target.select()"
      />
      <p id="published-link-hint" class="link-hint">{{ t("cpay.publish.linkHint") }}</p>

      <!-- INV-702: copy link / QR code / native share go here, for this same `publicUrl`. -->
      <slot name="share" :public-url="publicUrl" />
    </template>
    <p v-else class="link-missing" data-testid="public-url-missing">
      {{ t("cpay.publish.linkMissing") }}
      <router-link v-if="linksTo" :to="linksTo">{{ t("cpay.publish.invitationLinks") }}</router-link>
    </p>

    <div class="published-actions">
      <a
        v-if="publicUrl"
        class="result-btn primary"
        :href="publicUrl"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="open-invitation"
      >
        {{ t("cpay.publish.openInvitation") }}
        <span class="sr-only">{{ t("cpay.publish.newTab") }}</span>
      </a>
      <router-link
        v-if="editTo"
        class="result-btn secondary"
        :to="editTo"
        data-testid="continue-editing"
      >
        {{ t("cpay.publish.continueEditing") }}
      </router-link>
    </div>

    <!-- INV-703: where RSVP replies appear (guest list of this event) goes here. -->
    <slot name="next" :event-id="eventId" />
  </section>
</template>

<script setup>
import { useI18n } from "vue-i18n";

/**
 * INV-701 — the confirmed state after publishing: status, the public guest
 * link (already checked by the server and by `safePublicUrl`), "Open
 * invitation" and "Continue editing". Rendered only once the server has
 * confirmed the publication.
 *
 * Extension points: `#share` (INV-702 — copy/QR/share of `publicUrl`) and
 * `#next` (INV-703 — the RSVP dashboard for `eventId`).
 */
defineProps({
  /** Absolute public guest link, or '' when it cannot be shown. */
  publicUrl: { type: String, default: "" },
  eventId: { type: String, default: "" },
  /** Editor location (router `to`), or '' without a design. */
  editTo: { type: [Object, String], default: "" },
  /** Dashboard page with the invitation links, for when the link is missing. */
  linksTo: { type: [Object, String], default: "" },
});

const { t } = useI18n();
</script>

<style scoped>
.published { text-align: left; margin: 0 0 16px; }
.published-status { text-align: center; margin: 0 0 16px; }
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid #2e7d32;
  color: #1b5e20;
  background: #e8f5e9;
  font-size: 13px;
  font-weight: 700;
}
.link-label { display: block; font-size: 13px; font-weight: 700; color: var(--neutral-900, #1a1a1a); margin: 0 0 6px; }
.link-field {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--neutral-300, #ccc);
  border-radius: 10px;
  font-family: monospace;
  font-size: 13px;
  color: var(--neutral-900, #1a1a1a);
  background: #fafafa;
}
.link-field:focus-visible { outline: 3px solid var(--brand-gold, #b08d57); outline-offset: 2px; }
.link-hint { font-size: 12px; color: #5f5f5f; margin: 6px 0 16px; }
.link-missing { font-size: 13px; color: #5f5f5f; margin: 0 0 16px; overflow-wrap: anywhere; }
.published-actions { display: flex; flex-direction: column; gap: 10px; }
.result-btn {
  display: block;
  text-align: center;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  min-height: 44px;
  box-sizing: border-box;
}
.result-btn.primary { background: var(--brand-gold, #8a6d3b); color: #fff; border: 0; }
.result-btn.secondary { background: #fff; color: var(--neutral-900, #1a1a1a); border: 1px solid var(--neutral-300, #ccc); }
.result-btn:focus-visible { outline: 3px solid var(--neutral-900, #1a1a1a); outline-offset: 2px; }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
</style>
