<template>
  <section>
    <PageHeader :title="t('vendorPortal.portfolio')" :subtitle="t('vendorPortal.portfolioSubtitle')" />

    <p v-if="error" class="error">{{ error }}</p>

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

    <ul v-else class="gallery">
      <li v-for="item in items" :key="item.id" class="tile" :class="item.kind.toLowerCase()">
        <a v-if="item.kind !== 'IMAGE'" :href="item.url" target="_blank" rel="noopener" class="link-tile">
          <span class="kind">{{ t(`vendorPortal.mediaKind.${item.kind}`) }}</span>
          <span class="link-title">{{ item.title || item.url }}</span>
        </a>

        <img v-else :src="item.thumbnailUrl || item.url" :alt="item.title || ''" loading="lazy" />

        <div class="tile-foot">
          <span class="tile-title">{{ item.title }}</span>
          <button class="btn-danger" @click="remove(item)">{{ t('vendorPortal.delete') }}</button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useVendorProfile } from "@/composables/useVendorProfile";
import { vendorPortalService } from "@/services/vendorPortal.service";

const { t } = useI18n();
const { profile, load: loadProfile } = useVendorProfile();

const items = ref([]);
const error = ref(null);
const busy = ref(false);
const draft = reactive({ kind: "VIDEO", title: "", url: "" });

const canLink = computed(() => Boolean(profile.value?.capabilities?.includes("MEDIA_LINKS")));

onMounted(async () => {
  await loadProfile();
  await reload();
});

async function reload() {
  try {
    const { data } = await vendorPortalService.listMedia();
    items.value = data;
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
  } catch (e) {
    error.value = message(e);
  }
}

function message(e) {
  return e?.response?.data?.error?.detail ?? e?.response?.data?.message ?? e.message;
}
</script>

<style scoped>

h1 {
  font-size: 1.2rem;
  margin: 0;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #6b665e;
  font-size: 0.9rem;
}

.add-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.25rem;
}

.upload input {
  display: none;
}

.upload span,
.btn-primary,
.btn-danger {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
}

.upload span {
  background: #1f3d2b;
  color: #fff;
}

.btn-primary {
  background: #1f3d2b;
  border: none;
  color: #fff;
}

.btn-danger {
  background: transparent;
  border: 1px solid #a4292c;
  color: #a4292c;
  min-height: 36px;
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
}

.link-form {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
}

.link-form input,
.link-form select {
  padding: 0.5rem 0.625rem;
  min-height: 44px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  font: inherit;
}

.link-form input[type="url"] {
  flex: 1;
  min-width: 14rem;
}

.gallery {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.tile {
  background: #fff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tile img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
}

.link-tile {
  aspect-ratio: 4 / 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.875rem;
  background: #f4f1ea;
  text-decoration: none;
  color: #1d1b18;
}

.kind {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b665e;
}

.link-title {
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

.tile-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border-top: 1px solid #e8e4dc;
}

.tile-title {
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty {
  color: #6b665e;
}

.error {
  color: #a4292c;
}
</style>
