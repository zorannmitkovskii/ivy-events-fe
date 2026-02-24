<template>
  <BaseModal :open="open" :title="t('editAgenda.title')" @close="emit('close')">
    <div class="items-list" v-if="items.length">
      <div v-for="item in items" :key="item.id" class="item-row">
        <div class="item-info">
          <span class="item-type">{{ t(`agenda.types.${item.type}`) }}</span>
          <span class="item-time">{{ item.time || '' }}</span>
        </div>
        <div class="item-actions">
          <button class="icon-btn" type="button" @click="onEdit(item)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
          </button>
          <button class="icon-btn icon-btn--danger" type="button" @click="emit('delete', item.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <p v-else class="empty-msg">{{ t('editAgenda.empty') }}</p>

    <template #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">
        {{ t('common.close') }}
      </ButtonMain>
      <ButtonMain variant="main" type="button" @click="emit('add')">
        {{ t('editAgenda.addItem') }}
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const { t } = useI18n();

defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
});

const emit = defineEmits(["close", "add", "edit", "delete"]);

function onEdit(item) {
  emit("edit", item);
}
</script>

<style scoped>
.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--neutral-50, #f9fafb);
  border: 1px solid var(--neutral-200, #e5e7eb);
  border-radius: 10px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-type {
  font-size: 14px;
  font-weight: 600;
  color: var(--brand-main, #1f2937);
}

.item-time {
  font-size: 12px;
  color: var(--neutral-500, #6b7280);
}

.item-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid var(--neutral-200, #e5e7eb);
  border-radius: 6px;
  cursor: pointer;
  color: var(--neutral-600, #4b5563);
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: var(--neutral-100, #f3f4f6);
  border-color: var(--neutral-300, #d1d5db);
}

.icon-btn--danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.empty-msg {
  text-align: center;
  color: var(--neutral-500, #6b7280);
  font-size: 14px;
  padding: 24px 0;
}
</style>
