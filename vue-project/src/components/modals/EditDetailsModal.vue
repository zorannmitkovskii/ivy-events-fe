<template>
  <BaseModal :open="open" :title="t('editDetails.title')" @close="emit('close')">
    <div class="items-list" v-if="items.length">
      <div v-for="item in items" :key="item.id" class="item-card">
        <!-- Header row -->
        <div class="item-card-header" @click="toggleExpand(item.id)">
          <div class="item-info">
            <span class="item-type">{{ t(`detailTypes.${item.type}`) }}</span>
            <span class="item-time" v-if="!isExpanded(item.id)">{{ item.time || '' }}</span>
          </div>
          <div class="item-actions">
            <button v-if="!noAdd" class="icon-btn icon-btn--danger" type="button" @click.stop="emit('delete', item.id)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
            <svg
              class="expand-chevron"
              :class="{ 'expand-chevron--open': isExpanded(item.id) }"
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>

        <!-- Expandable inline form -->
        <div v-if="isExpanded(item.id)" class="item-card-body">
          <div class="field">
            <label>{{ t('eventDetail.form.type') }}</label>
            <select class="input" :value="item.type" @change="onFieldChange(item, 'type', $event.target.value)">
              <option v-for="val in availableTypes" :key="val" :value="val">
                {{ t(`detailTypes.${val}`) }}
              </option>
            </select>
          </div>
          <div class="two">
            <div class="field">
              <label>{{ t('eventDetail.form.eventDate') }}</label>
              <DateInput input-class="input" :model-value="item.eventDate || ''" @update:model-value="onFieldChange(item, 'eventDate', $event)" />
            </div>
            <div class="field">
              <label>{{ t('eventDetail.form.time') }}</label>
              <div class="time-selects">
                <select class="input" :value="getHour(item.time)" @change="onTimeChange(item, $event.target.value, getMinute(item.time))">
                  <option v-for="h in 24" :key="h-1" :value="String(h-1).padStart(2,'0')">
                    {{ String(h-1).padStart(2,'0') }}
                  </option>
                </select>
                <span class="time-sep">:</span>
                <select class="input" :value="getMinute(item.time)" @change="onTimeChange(item, getHour(item.time), $event.target.value)">
                  <option v-for="m in [0,5,10,15,20,25,30,35,40,45,50,55]" :key="m" :value="String(m).padStart(2,'0')">
                    {{ String(m).padStart(2,'0') }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <AuthLocationInput
            :modelValue="getLocationModel(item)"
            @update:modelValue="onLocationChange(item, $event)"
            :label="t('eventDetail.form.location')"
            :placeholder="t('eventDetail.form.locationPh')"
            :types="[]"
            :pickOnMapLabel="t('common.pickOnMap')"
            :cancelLabel="t('common.cancel')"
            :useThisLocationLabel="t('common.useThisLocation')"
            :searchPlaceholder="t('common.searchPlaces')"
            :locatingLabel="t('common.locateMe')"
            :locatingLabelLoading="t('common.locating')"
            :selectedLabel="t('common.selected')"
            :loadingAddressLabel="t('common.loadingAddress')"
          >
            <template #icon>📍</template>
          </AuthLocationInput>
        </div>
      </div>
    </div>
    <p v-else class="empty-msg">{{ t('editDetails.empty') }}</p>

    <template #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">
        {{ t('common.close') }}
      </ButtonMain>
      <ButtonMain v-if="!props.noAdd && (!props.maxItems || items.length < props.maxItems)" variant="main" type="button" @click="emit('add')">
        {{ t('editDetails.addItem') }}
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import DateInput from "@/components/generic/DateInput.vue";
import AuthLocationInput from "@/components/auth/AuthLocationInput.vue";
import { EventDetailType } from "@/enums/EventDetailType";

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  maxItems: { type: Number, default: 0 },
  noAdd: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "add", "delete", "update"]);

const expandedId = ref(null);

const availableTypes = computed(() => Object.values(EventDetailType));

function isExpanded(id) { return expandedId.value === id; }
function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id; }

function getHour(time) {
  if (!time) return '00';
  return (time.split(':')[0] || '00').padStart(2, '0');
}

function getMinute(time) {
  if (!time) return '00';
  return (time.split(':')[1] || '00').padStart(2, '0');
}

function getLocationModel(item) {
  const loc = item.location || {};
  return {
    name: loc.name || '',
    address: loc.addressLine || loc.address || '',
    lat: loc.latitude ?? loc.lat ?? null,
    lng: loc.longitude ?? loc.lng ?? null,
    placeId: loc.placeId ?? null,
  };
}

function onFieldChange(item, field, value) {
  const updated = { ...item, [field]: value };
  emitUpdate(updated);
}

function onTimeChange(item, hour, minute) {
  const updated = { ...item, time: `${hour}:${minute}` };
  emitUpdate(updated);
}

function onLocationChange(item, loc) {
  const hasLocation = loc.name || loc.address || loc.lat != null;
  const updated = {
    ...item,
    location: hasLocation ? {
      name: loc.name || null,
      type: 'VENUE',
      addressLine: loc.address || null,
      latitude: loc.lat,
      longitude: loc.lng,
      isActive: true,
    } : null,
  };
  emitUpdate(updated);
}

function emitUpdate(item) {
  const payload = {
    id: item.id,
    type: item.type,
    eventDate: item.eventDate || null,
    time: item.time || '00:00',
    description: item.description ?? null,
    visibility: item.visibility ?? null,
    icon: item.icon ?? null,
    location: item.location || null,
  };
  emit('update', payload);
}
</script>

<style scoped>
.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-card {
  background: var(--neutral-50, #f9fafb);
  border: 1px solid var(--neutral-200, #e5e7eb);
  border-radius: 10px;
  overflow: hidden;
}

.item-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.item-card-header:hover {
  background: var(--neutral-100, #f3f4f6);
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
  align-items: center;
  gap: 6px;
}

.expand-chevron {
  transition: transform 0.2s ease;
  color: var(--neutral-400, #9ca3af);
}

.expand-chevron--open {
  transform: rotate(90deg);
}

.item-card-body {
  padding: 0 12px 12px;
  display: grid;
  gap: 12px;
}

.field label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-500);
  display: block;
  margin-bottom: 6px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.input {
  width: 100%;
  border: 2px solid var(--neutral-300);
  background: var(--bg-main, #fff);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--brand-main);
  outline: none;
  transition: border-color 0.2s ease;
}

.input:focus {
  border-color: var(--brand-gold);
}

.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.time-selects {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-selects .input {
  flex: 1;
  text-align: center;
}

.time-sep {
  font-weight: 700;
  font-size: 16px;
  color: var(--neutral-500);
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

@media (max-width: 600px) {
  .two {
    grid-template-columns: 1fr;
  }
}
</style>
