<template>
  <tr class="clickable-row" @click="$emit('edit', item)">
    <td>
      <div class="item-title">{{ item.title }}</div>
      <div v-if="item.description" class="item-desc">{{ item.description }}</div>
    </td>

    <td>
      <span class="type-pill">{{ t(`agenda.types.${item.type}`) }}</span>
    </td>

    <td>{{ formattedDateTime }}</td>

    <td>
      <div v-if="item.location?.name" class="location-name">{{ item.location.name }}</div>
      <div v-if="item.location?.addressLine" class="location-addr">{{ item.location.addressLine }}</div>
      <div v-if="!item.location?.name && !item.location?.addressLine" class="empty">—</div>
    </td>

    <td>
      <span class="visibility-badge">{{ t(`agenda.visibility.${item.visibility}`) }}</span>
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
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  item: { type: Object, required: true }
});

defineEmits(["edit", "delete"]);

const formattedDateTime = computed(() => {
  if (!props.item.dateTime) return "—";
  const d = new Date(props.item.dateTime);
  if (isNaN(d)) return props.item.dateTime;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});
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

.location-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--neutral-900);
}

.location-addr {
  font-size: 12px;
  color: var(--neutral-500);
  margin-top: 2px;
}

.empty {
  color: var(--neutral-400);
}

.visibility-badge {
  font-size: 13px;
  color: var(--neutral-500);
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
