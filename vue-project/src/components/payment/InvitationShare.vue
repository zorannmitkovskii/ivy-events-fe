<template>
  <section v-if="safeUrl" class="share" aria-labelledby="invitation-share-title" data-testid="invitation-share">
    <h2 id="invitation-share-title" class="share-title">{{ t("cpay.publish.share.title") }}</h2>

    <div class="share-actions">
      <button type="button" class="share-btn primary" data-testid="copy-link" @click="copy">
        <i :class="copied ? 'bi bi-check-lg' : 'bi bi-clipboard'" aria-hidden="true"></i>
        {{ copied ? t("cpay.publish.share.copied") : t("cpay.publish.share.copy") }}
      </button>
      <button
        v-if="canShare"
        type="button"
        class="share-btn secondary"
        data-testid="native-share"
        @click="share"
      >
        <i class="bi bi-share" aria-hidden="true"></i>
        {{ t("cpay.publish.share.share") }}
      </button>
    </div>

    <!-- Copy/share results: confirmations politely, problems as alerts. -->
    <p class="share-status" role="status" aria-live="polite" data-testid="share-status">{{ statusText }}</p>
    <p v-if="errorText" class="share-error" role="alert" data-testid="share-error">{{ errorText }}</p>

    <figure class="qr">
      <img
        v-if="qrDataUrl"
        class="qr-image"
        :src="qrDataUrl"
        :alt="t('cpay.publish.share.qrAlt')"
        data-testid="qr-image"
        :data-qr-url="qrFor"
      />
      <div v-else-if="!qrFailed" class="qr-placeholder" aria-hidden="true"></div>
      <figcaption class="qr-hint">
        {{ qrFailed ? t("cpay.publish.share.qrFailed") : t("cpay.publish.share.qrHint") }}
      </figcaption>
      <a
        v-if="qrDataUrl"
        class="share-btn secondary"
        :href="qrDataUrl"
        :download="qrFileName"
        data-testid="qr-download"
      >
        <i class="bi bi-download" aria-hidden="true"></i>
        {{ t("cpay.publish.share.qrDownload") }}
      </a>
    </figure>
  </section>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { safePublicUrl } from "@/utils/publishOutcome";
import { copyText } from "@/utils/copyText";

/**
 * INV-702 — share the published invitation: copy the link, a downloadable QR
 * code and (where the browser has one) the native share sheet.
 *
 * Everything here uses one URL: the event's public guest link. It is checked
 * again with `safePublicUrl` (the parent already did), so the private link, an
 * editor address or another event's link is never copied, encoded or shared —
 * the section is simply not rendered. Sharing only opens the system sheet; the
 * organizer picks who gets it, nothing is sent on their behalf.
 */
const props = defineProps({
  /** The public guest link (absolute). */
  url: { type: String, default: "" },
  eventId: { type: String, default: "" },
  /** Id of the field showing the link — focused (and selected) if copying fails. */
  fieldId: { type: String, default: "" },
});

/** Print-friendly QR: black on white, the standard 4-module quiet zone, 8 px modules. */
const QR_OPTIONS = Object.freeze({
  errorCorrectionLevel: "M",
  margin: 4,
  scale: 8,
  color: { dark: "#000000", light: "#ffffff" },
});

const { t } = useI18n();

const safeUrl = computed(() => safePublicUrl(props.url, props.eventId));
const qrFileName = computed(() => `ivy-invitation-qr-${String(props.eventId).slice(0, 8)}.png`);

const copied = ref(false);
const statusText = ref("");
const errorText = ref("");
const qrDataUrl = ref("");
const qrFor = ref("");
const qrFailed = ref(false);

const canShare = computed(() => {
  if (!safeUrl.value || typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return true;
  try {
    return navigator.canShare({ url: safeUrl.value }) !== false;
  } catch {
    return false;
  }
});

let resetTimer = null;
let announceTimer = null;
function announce(status, error = "") {
  clearTimeout(resetTimer);
  clearTimeout(announceTimer);
  // Cleared first so the same message is announced again on a repeated press.
  statusText.value = "";
  errorText.value = "";
  announceTimer = setTimeout(() => {
    statusText.value = status;
    errorText.value = error;
  }, 30);
}

async function copy() {
  const url = safeUrl.value;
  if (!url) return;
  const ok = await copyText(url);
  if (ok) {
    copied.value = true;
    announce(t("cpay.publish.share.copied"));
    resetTimer = setTimeout(() => {
      copied.value = false;
      statusText.value = "";
    }, 4000);
    return;
  }
  copied.value = false;
  announce("", t("cpay.publish.share.copyFailed"));
  // Hand the user the link selected, ready to copy by hand.
  const field = props.fieldId ? document.getElementById(props.fieldId) : null;
  if (field) {
    field.focus();
    if (typeof field.select === "function") field.select();
  }
}

async function share() {
  const url = safeUrl.value;
  if (!url || !canShare.value) return;
  try {
    await navigator.share({ title: t("cpay.publish.share.shareTitle"), url });
  } catch (e) {
    // Closing the sheet is not an error.
    if (e && e.name === "AbortError") return;
    announce("", t("cpay.publish.share.shareFailed"));
  }
}

let qrRun = 0;
async function renderQr(url) {
  const run = ++qrRun;
  qrDataUrl.value = "";
  qrFor.value = "";
  qrFailed.value = false;
  if (!url) return;
  try {
    const QRCode = await import("qrcode");
    const dataUrl = await QRCode.toDataURL(url, QR_OPTIONS);
    if (run !== qrRun) return;
    qrDataUrl.value = dataUrl;
    qrFor.value = url;
  } catch (e) {
    if (run !== qrRun) return;
    console.error("QR render failed", e);
    qrFailed.value = true;
  }
}

watch(safeUrl, renderQr, { immediate: true });
onBeforeUnmount(() => {
  clearTimeout(resetTimer);
  clearTimeout(announceTimer);
  qrRun += 1;
});
</script>

<style scoped>
.share {
  margin: 0 0 16px;
  padding: 16px 0 0;
  border-top: 1px solid var(--neutral-200, #e6e6e6);
}
.share-title { font-size: 15px; font-weight: 700; margin: 0 0 10px; color: var(--neutral-900, #1a1a1a); }
.share-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.share-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1 1 160px;
  min-height: 44px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
}
.share-btn.primary { background: var(--neutral-900, #1a1a1a); color: #fff; border: 0; }
.share-btn.secondary { background: #fff; color: var(--neutral-900, #1a1a1a); border: 1px solid var(--neutral-300, #ccc); }
.share-btn:hover { opacity: 0.9; }
.share-btn:focus-visible { outline: 3px solid var(--brand-gold, #b08d57); outline-offset: 2px; }
.share-status { min-height: 1.4em; margin: 8px 0 0; font-size: 13px; color: #1b5e20; }
.share-error { margin: 6px 0 0; font-size: 13px; color: #b3261e; overflow-wrap: anywhere; }
.qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 12px 0 0;
}
.qr-image,
.qr-placeholder {
  display: block;
  width: 200px;
  max-width: 100%;
  aspect-ratio: 1;
  height: auto;
  border: 1px solid var(--neutral-200, #e6e6e6);
  border-radius: 8px;
  image-rendering: pixelated;
}
.qr-placeholder { background: #f4f4f4; }
.qr-hint { font-size: 12px; color: #5f5f5f; text-align: center; margin: 0; }
.qr .share-btn { flex: 0 0 auto; width: 100%; }
</style>
