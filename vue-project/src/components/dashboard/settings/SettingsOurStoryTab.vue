<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useOurStory } from "@/composables/useOurStory.js";
import AddOurStoryModal from "@/components/modals/AddOurStoryModal.vue";
import OurStoryImagesModal from "@/components/modals/OurStoryImagesModal.vue";
import OurStoryUploadModal from "@/components/modals/OurStoryUploadModal.vue";
import OurStoryHeader from "@/components/dashboard/ourStory/OurStoryHeader.vue";
import DashboardTable from "@/components/dashboard/DashboardTable.vue";
import OurStoryTableRow from "@/components/dashboard/ourStory/OurStoryTableRow.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { onboardingStore } from "@/store/onboarding.store.js";
import { OUR_STORY_FIELD_CONFIG, DEFAULT_FIELD_CONFIG } from "@/config/ourStoryFieldConfig.js";

const { t } = useI18n();

const fieldConfig = computed(() =>
  OUR_STORY_FIELD_CONFIG[onboardingStore.invitationName] || DEFAULT_FIELD_CONFIG
);
const showType = computed(() => !!fieldConfig.value.type?.show);

const {
  loading, error,
  items, images,
  loadStories, createItem, updateItem, deleteItem,
} = useOurStory();

const modalOpen = ref(false);
const editingItem = ref(null);

function openCreateModal() {
  editingItem.value = null;
  modalOpen.value = true;
}

function openEditModal(item) {
  editingItem.value = { ...item };
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  editingItem.value = null;
}

const imagesModalOpen = ref(false);
const imagesItem = ref(null);

function openImagesModal(item) {
  imagesItem.value = { ...item };
  imagesModalOpen.value = true;
}

function closeImagesModal() {
  imagesModalOpen.value = false;
  imagesItem.value = null;
}

function onImagesUpdated({ id, imageUrl }) {
  const idx = items.value.findIndex((x) => x.id === id);
  if (idx !== -1) items.value[idx].imageUrl = imageUrl;
}

const uploadModalOpen = ref(false);

function openUploadModal() {
  uploadModalOpen.value = true;
}

function closeUploadModal() {
  uploadModalOpen.value = false;
}

function onUploaded() {
  loadStories();
}

onMounted(() => {
  loadStories();
});

async function onSave(payload, file) {
  if (payload.id) {
    await updateItem(payload.id, payload, file);
  } else {
    payload.displayOrder = items.value.length;
    await createItem(payload, file);
  }
  closeModal();
}

async function onDelete(id) {
  await deleteItem(id);
  closeModal();
}
</script>

<template>
  <div>
    <OurStoryHeader
      :addLabel="t('ourStory.addStory')"
      :imagesLabel="t('ourStory.addImages')"
      :has-items="items.length > 0"
      @add="openCreateModal"
      @add-images="openUploadModal"
    />

    <div v-if="loading" class="loading-msg">Loading...</div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <div v-else-if="items.length === 0" class="empty-card">
      <div class="empty-title">{{ t('ourStory.emptyTitle') }}</div>
      <div class="empty-sub">{{ t('ourStory.emptyMessage') }}</div>
      <div style="margin-top:12px;">
        <ButtonMain variant="main" @click="openCreateModal">{{ t('ourStory.addStory') }}</ButtonMain>
      </div>
    </div>

    <DashboardTable v-else>
      <template #head>
        <th>{{ t("ourStory.th.title") }}</th>
        <th v-if="showType">{{ t("ourStory.th.type") }}</th>
        <th>{{ t("ourStory.th.actions") }}</th>
      </template>

      <template #body>
        <OurStoryTableRow
          v-for="item in items"
          :key="item.id"
          :item="item"
          :show-type="showType"
          @edit="openEditModal"
          @delete="onDelete"
          @images="openImagesModal"
        />
      </template>

      <template #footer>
        <span>{{ t("ourStory.totalItems", { count: items.length }) }}</span>
      </template>
    </DashboardTable>

    <AddOurStoryModal
      :open="modalOpen"
      :item="editingItem"
      @close="closeModal"
      @submit="onSave"
      @delete="onDelete"
    />

    <OurStoryImagesModal
      :open="imagesModalOpen"
      :item="imagesItem"
      @close="closeImagesModal"
      @updated="onImagesUpdated"
    />

    <OurStoryUploadModal
      :open="uploadModalOpen"
      :images="images"
      @close="closeUploadModal"
      @uploaded="onUploaded"
    />
  </div>
</template>

<style scoped>
.loading-msg { padding: 18px 0; color: var(--neutral-500); }
.error-msg { padding: 18px 0; color: #b00020; }

.empty-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
}
.empty-title { font-weight: 700; font-size: 15px; color: var(--neutral-900); }
.empty-sub { margin-top: 6px; font-size: 13px; color: var(--neutral-500); }
</style>
