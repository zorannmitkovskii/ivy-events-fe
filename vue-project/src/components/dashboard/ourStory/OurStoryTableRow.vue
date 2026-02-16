<template>
  <tr class="clickable-row" @click="$emit('edit', item)">
    <td>
      <div class="item-title">{{ item.title }}</div>
      <div v-if="item.description" class="item-desc">{{ item.description }}</div>
    </td>

    <td>
      <span class="type-pill">{{ t(`storyTypes.${item.type}`) }}</span>
    </td>

    <td>
      <div class="actions">
        <button class="action-link" type="button" @click.stop="$emit('edit', item)">{{ t("common.edit") }}</button>
        <button class="action-link action-remove" type="button" @click.stop="$emit('delete', item.id)">{{ t("common.delete") }}</button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps({
  item: { type: Object, required: true }
});

defineEmits(["edit", "delete"]);
</script>

<style scoped>
.item-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--neutral-900);
}

.item-desc {
  font-size: 13px;
  color: var(--neutral-500);
  margin-top: 2px;
}

.type-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(200, 162, 77, 0.12);
  color: var(--brand-gold, #c8a24d);
  white-space: nowrap;
}

.actions {
  display: flex;
  gap: 12px;
}

.action-link {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--brand-dark);
  transition: color 0.15s ease;
}

.action-link:hover {
  color: var(--brand-main);
}

.action-remove {
  color: var(--error);
}

.action-remove:hover {
  color: #c0302b;
}

.clickable-row {
  cursor: pointer;
}
</style>
