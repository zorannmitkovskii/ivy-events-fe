<template>
  <details class="filters-fold">
    <summary>{{ t('adminOverview.filters') }}</summary>
    <form class="filters" @submit.prevent="$emit('apply')">
      <label>
        <span>{{ t('adminOverview.from') }}</span>
        <input v-model="from" type="date" />
      </label>
      <label>
        <span>{{ t('adminOverview.to') }}</span>
        <input v-model="to" type="date" />
      </label>
      <label>
        <span>{{ t('adminOverview.eventType') }}</span>
        <select v-model="categoryType">
          <option value="">{{ t('adminOverview.allTypes') }}</option>
          <!-- The value stays the enum the API expects; only the label is
               translated. Before IVY-1204 the reader was shown BABY_SHOWER. -->
          <option v-for="type in eventTypes" :key="type" :value="type">
            {{ t(`eventTypes.${type}`) }}
          </option>
        </select>
      </label>
      <button type="submit" class="apply" :disabled="loading">{{ t('adminOverview.apply') }}</button>
      <button v-if="hasFilters" type="button" class="clear" @click="$emit('clear')">
        {{ t('adminOverview.clear') }}
      </button>
    </form>
  </details>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

/**
 * The dashboard's date range and event type, folded away.
 *
 * <p>Its own component so the dashboard can place it under the data or above
 * everything without the form existing twice. It holds no state: the
 * dashboard owns the filters, the request and the URL.
 */
defineProps({
  eventTypes: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  hasFilters: { type: Boolean, default: false },
})

defineEmits(['apply', 'clear'])

const from = defineModel('from', { type: String, default: '' })
const to = defineModel('to', { type: String, default: '' })
const categoryType = defineModel('categoryType', { type: String, default: '' })

const { t } = useI18n()
</script>

<style scoped>
.filters {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filters label {
  font-family: var(--font-ui);
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-muted, #52514e);
}

.filters input,
.filters select {
  border: 1px solid var(--border-color, #cbd0d6);
  border-radius: 8px;
  padding: 7px 10px;
  background: var(--cards-color, #fff);
  color: var(--text-color, #0b0b0b);
}

.apply,
.clear {
  border: 1px solid var(--border-color, #cbd0d6);
  background: var(--cards-color, #fff);
  color: var(--text-color, #0b0b0b);
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
}

.apply:disabled {
  opacity: 0.6;
  cursor: progress;
}
</style>
