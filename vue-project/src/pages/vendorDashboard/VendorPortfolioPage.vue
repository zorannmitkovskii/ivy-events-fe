<template>
  <section>
    <PageHeader :title="t('vendorPortal.portfolio')" :subtitle="t('vendorPortal.portfolioSubtitle')" />

    <p v-if="error" class="error">{{ error }}</p>

    <!--
      The handle sits above the grid rather than beside a form field, because
      it is the one thing a couple looks for after the pictures. It links out;
      nothing here reads the account. See `instagramHandle` for why.
    -->
    <a
      v-if="instagramHandle"
      class="ig-link"
      :href="profile.instagramUrl"
      target="_blank"
      rel="noopener"
    >
      <span class="ig-mark" aria-hidden="true"></span>
      <span class="ig-handle">{{ instagramHandle }}</span>
      <span class="ig-follow">{{ t('vendorPortal.followOnInstagram') }}</span>
    </a>

    <div class="add-row">
      <label class="upload">
        <input type="file" accept="image/*" multiple :disabled="busy" @change="onPick" />
        <span>{{ busy ? t('vendorPortal.uploading') : t('vendorPortal.addPhotos') }}</span>
      </label>

      <!-- Recordings and showreels are linked, never uploaded: a band already
           publishes on YouTube and expects to point at what is there. -->
      <form v-if="canLink" class="link-form" @submit.prevent="addLink">
        <select v-model="draft.kind">
          <option value="VIDEO">{{ t('vendorPortal.mediaKind.VIDEO') }}</option>
          <option value="AUDIO">{{ t('vendorPortal.mediaKind.AUDIO') }}</option>
        </select>
        <input v-model="draft.title" :placeholder="t('vendorPortal.mediaTitle')" />
        <input v-model="draft.url" :placeholder="t('vendorPortal.mediaUrl')" type="url" required />
        <button class="btn-primary" type="submit" :disabled="busy">
          {{ t('vendorPortal.addLink') }}
        </button>
      </form>
    </div>

    <p v-if="!items.length && !busy" class="empty">{{ t('vendorPortal.portfolioEmpty') }}</p>

    <!--
      Square tiles in threes, the shape people already read as a body of work.
      The controls stay out of the picture until the pointer is on a tile, so
      the grid reads as the portfolio it is and not as a file manager.
    -->
    <ul v-else class="grid">
      <li v-for="(item, index) in items" :key="item.id" class="cell">
        <button type="button" class="cell-open" @click="openAt(index)">
          <img
            v-if="item.kind === 'IMAGE'"
            :src="item.thumbnailUrl || item.url"
            :alt="item.title || ''"
            loading="lazy"
          />
          <span v-else class="cell-link">
            <span class="cell-kind">{{ t(`vendorPortal.mediaKind.${item.kind}`) }}</span>
            <span class="cell-title">{{ item.title || item.url }}</span>
          </span>

          <span v-if="item.title" class="cell-hover">{{ item.title }}</span>
        </button>

        <button class="cell-remove" :title="t('vendorPortal.delete')" @click="remove(item)">
          <span aria-hidden="true">×</span>
          <span class="visually-hidden">{{ t('vendorPortal.delete') }}</span>
        </button>

        <!-- The cover leads the microsite and the marketplace card, so it is
             named on its tile; the rest can be made the cover or moved. -->
        <span v-if="item.cover" class="cell-cover">{{ t('vendorWork.portfolio.cover') }}</span>
        <div class="cell-tools">
          <button
            v-if="item.kind === 'IMAGE' && !item.cover"
            type="button"
            class="cell-tool"
            :disabled="busy"
            @click="setCover(item)"
          >{{ t('vendorWork.portfolio.makeCover') }}</button>
          <button
            type="button"
            class="cell-tool"
            :disabled="busy || index === 0"
            :aria-label="t('vendorWork.portfolio.moveEarlier', { title: item.title || '' })"
            @click="move(index, -1)"
          >←</button>
          <button
            type="button"
            class="cell-tool"
            :disabled="busy || index === items.length - 1"
            :aria-label="t('vendorWork.portfolio.moveLater', { title: item.title || '' })"
            @click="move(index, 1)"
          >→</button>
        </div>
      </li>
    </ul>

    <!-- Opened from a tile: the full picture, and the arrows to walk the grid. -->
    <div v-if="lightbox !== null" class="lightbox" role="dialog" aria-modal="true" @click.self="closeLightbox">
      <button class="lb-close" :aria-label="t('vendorPortal.close')" @click="closeLightbox">×</button>
      <button v-if="items.length > 1" class="lb-nav prev" aria-label="←" @click="step(-1)">‹</button>

      <figure class="lb-figure">
        <img
          v-if="current.kind === 'IMAGE'"
          :src="current.url"
          :alt="current.title || ''"
        />
        <a v-else :href="current.url" target="_blank" rel="noopener" class="lb-external">
          {{ current.title || current.url }}
        </a>
        <figcaption v-if="current.title">{{ current.title }}</figcaption>
      </figure>

      <button v-if="items.length > 1" class="lb-nav next" aria-label="→" @click="step(1)">›</button>
    </div>
  </section>
</template>

<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed, onMounted, onBeforeUnmount, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useVendorProfile } from "@/composables/useVendorProfile";
import { vendorPortalService } from "@/services/vendorPortal.service";
import { vendorWorkspaceService } from "@/services/vendorWorkspace.service";

const { t } = useI18n();
const { profile, load: loadProfile } = useVendorProfile();

const items = ref([]);
const error = ref(null);
const busy = ref(false);
const draft = reactive({ kind: "VIDEO", title: "", url: "" });
const lightbox = ref(null);

const canLink = computed(() => Boolean(profile.value?.capabilities?.includes("MEDIA_LINKS")));

/**
 * The handle, read off the URL the vendor already gave us.
 *
 * <p>Only the handle, and only as a link. Showing the actual feed would mean
 * each vendor connecting their account: the Basic Display API was withdrawn in
 * December 2024, and its replacement needs a business account, an OAuth round
 * trip and Meta's review. The grid below is their own work, which we hold and
 * can always render.
 */
const instagramHandle = computed(() => {
  const raw = profile.value?.instagramUrl;
  if (!raw) return "";

  const path = String(raw)
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@/, "");

  return path ? `@${path}` : "";
});

const current = computed(() => items.value[lightbox.value] ?? {});

/**
 * One layer, not a destructure.
 *
 * <p>The vendor-portal endpoints answer with a bare list while the rest of the
 * API wraps everything in {@code ApiResponse}. `const { data } = …` reads
 * `undefined` off an array and the grid then renders nothing whatever the
 * vendor has uploaded.
 */
function unwrap(response) {
  return response?.data ?? response ?? null;
}

onMounted(async () => {
  await loadProfile();
  await reload();
  window.addEventListener("keydown", onKey);
});

onBeforeUnmount(() => window.removeEventListener("keydown", onKey));

function onKey(event) {
  if (lightbox.value === null) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") step(-1);
  if (event.key === "ArrowRight") step(1);
}

function openAt(index) {
  lightbox.value = index;
}

function closeLightbox() {
  lightbox.value = null;
}

/** Wraps at both ends: a grid has no first or last once you are inside it. */
function step(delta) {
  const count = items.value.length;
  if (!count) return;
  lightbox.value = (lightbox.value + delta + count) % count;
}

async function reload() {
  try {
    items.value = unwrap(await vendorPortalService.listMedia()) ?? [];
  } catch (e) {
    error.value = message(e);
  }
}

/**
 * Uploaded one at a time rather than as one request: a batch that fails
 * halfway leaves the owner guessing which photos arrived, and the endpoint
 * takes a single file.
 */
async function onPick(event) {
  const files = Array.from(event.target.files ?? []);
  if (!files.length) return;

  busy.value = true;
  error.value = null;
  try {
    for (const file of files) {
      await vendorPortalService.uploadMedia(file, file.name.replace(/\.[^.]+$/, ""));
    }
    await reload();
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
    event.target.value = "";
  }
}

async function addLink() {
  busy.value = true;
  error.value = null;
  try {
    await vendorPortalService.addMediaLink({ ...draft });
    draft.title = "";
    draft.url = "";
    await reload();
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}

async function remove(item) {
  try {
    await vendorPortalService.deleteMedia(item.id);
    items.value = items.value.filter((candidate) => candidate.id !== item.id);
    // The open picture may have just been deleted, or moved under a new index.
    closeLightbox();
  } catch (e) {
    error.value = message(e);
  }
}

/**
 * Makes one picture the cover. The server moves it to the front and answers
 * with the new order, which is the one drawn — the grid and the microsite
 * must agree on which picture leads.
 */
async function setCover(item) {
  await rearrange(() => vendorWorkspaceService.setCover(item.id));
}

/** One step earlier or later. The whole order is sent, so a stale grid cannot half-apply. */
async function move(index, delta) {
  const ids = items.value.map((item) => item.id);
  const target = index + delta;
  if (target < 0 || target >= ids.length) return;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  await rearrange(() => vendorWorkspaceService.reorderMedia(ids));
}

async function rearrange(request) {
  busy.value = true;
  error.value = null;
  try {
    items.value = unwrap(await request()) ?? items.value;
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}

function message(e) {
  return e?.response?.data?.error?.detail ?? e?.response?.data?.message ?? e.message;
}
</script>

<style scoped>
.cell-cover {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(21, 50, 37, 0.82);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  pointer-events: none;
}

.cell-tools {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.cell:hover .cell-tools,
.cell:focus-within .cell-tools {
  opacity: 1;
}

.cell-tool {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border: 0;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.92);
  color: #1f3d2b;
  font-size: 12px;
  font-weight: 700;
}

.cell-tool:disabled {
  opacity: 0.45;
}

.error {
  color: #b3261e;
  margin: 0 0 0.75rem;
}

.empty {
  color: #6b6b6b;
  padding: 2.5rem 0;
  text-align: center;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* ── the handle ─────────────────────────────────────────────── */

.ig-link {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 1.1rem;
  padding: 0.5rem 0.9rem 0.5rem 0.55rem;
  border: 1px solid #e8e4dc;
  border-radius: 999px;
  text-decoration: none;
  color: #1d1b18;
  background: #fff;
  transition: border-color 0.15s;
}

.ig-link:hover { border-color: #c9c2b4; }

/* The ring, drawn rather than fetched: an <img> from a CDN is one more thing
   that can be blocked and leave a broken icon beside the vendor's name. */
.ig-mark {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285aeb 90%);
  position: relative;
  flex: none;
}

.ig-mark::after {
  content: "";
  position: absolute;
  inset: 5px;
  border: 1.5px solid #fff;
  border-radius: 50%;
}

.ig-handle { font-weight: 600; font-size: 0.9rem; }

.ig-follow {
  font-size: 0.78rem;
  color: #6b6b6b;
  border-left: 1px solid #e8e4dc;
  padding-left: 0.6rem;
}

/* ── controls ───────────────────────────────────────────────── */

.add-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.25rem;
}

.upload input { display: none; }

.upload span {
  display: inline-block;
  padding: 0.5rem 1rem;
  border: 1px solid #1d1b18;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
}

.link-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.link-form input,
.link-form select {
  padding: 0.45rem 0.6rem;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  font: inherit;
  min-height: 2.25rem;
}

.btn-primary {
  padding: 0.5rem 1rem;
  border: 0;
  border-radius: 8px;
  background: #1d1b18;
  color: #fff;
  cursor: pointer;
  font-size: 0.875rem;
}

/* ── the grid ───────────────────────────────────────────────── */

.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

@media (max-width: 640px) {
  .grid { gap: 2px; }
}

.cell {
  position: relative;
  aspect-ratio: 1 / 1;
  background: #f4f1ea;
  overflow: hidden;
}

.cell-open {
  all: unset;
  display: block;
  width: 100%;
  height: 100%;
  cursor: zoom-in;
}

.cell-open:focus-visible { outline: 2px solid #1d1b18; outline-offset: -2px; }

.cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cell-link {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.375rem;
  height: 100%;
  padding: 0.875rem;
  box-sizing: border-box;
}

.cell-kind {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b6b6b;
}

.cell-title {
  font-size: 0.8125rem;
  overflow-wrap: anywhere;
}

/* The caption belongs to the hover state, the way a grid of work does it. */
.cell-hover {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 0.6rem;
  font-size: 0.78rem;
  color: #fff;
  background: linear-gradient(transparent 55%, rgba(0, 0, 0, 0.62));
  opacity: 0;
  transition: opacity 0.16s;
  pointer-events: none;
}

.cell-open:hover .cell-hover,
.cell-open:focus-visible .cell-hover { opacity: 1; }

.cell-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #b3261e;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.16s;
}

.cell:hover .cell-remove,
.cell-remove:focus-visible { opacity: 1; }

/* Touch has no hover, so the control has to be there from the start. */
@media (hover: none) {
  .cell-remove { opacity: 1; }
}

/* ── lightbox ───────────────────────────────────────────────── */

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(15, 14, 12, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

.lb-figure {
  margin: 0;
  max-width: min(900px, 92vw);
  max-height: 84vh;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  align-items: center;
}

.lb-figure img {
  max-width: 100%;
  max-height: 76vh;
  object-fit: contain;
  display: block;
}

.lb-figure figcaption {
  color: #f4f1ea;
  font-size: 0.85rem;
  text-align: center;
}

.lb-external {
  color: #f4f1ea;
  font-size: 1rem;
  overflow-wrap: anywhere;
}

.lb-close,
.lb-nav {
  position: absolute;
  background: none;
  border: 0;
  color: #f4f1ea;
  cursor: pointer;
  line-height: 1;
}

.lb-close { top: 1rem; right: 1.25rem; font-size: 2rem; }
.lb-nav { top: 50%; transform: translateY(-50%); font-size: 3rem; padding: 0 1rem; }
.prev { left: 0; }
.next { right: 0; }

.lb-close:focus-visible,
.lb-nav:focus-visible { outline: 2px solid #f4f1ea; outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .cell-hover,
  .cell-remove { transition: none; }
}
</style>
