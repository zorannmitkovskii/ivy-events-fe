<template>
  <tr class="clickable-row" :class="{ 'row-declined': isDeclined }" @click="$emit('edit', guest)">
    <td>
      <div class="g-name-cell">
        <div class="g-avatar" :style="{ background: avatarColor }" aria-hidden="true">
          {{ initials }}
        </div>
        <div class="g-name-block">
          <div class="guest-name">{{ guest.name }}</div>
          <div class="guest-email">{{ guest.email || t('guests.noEmail') }}</div>
        </div>
      </div>
    </td>

    <td>
      <div class="status-wrap" :class="pillClass" @click.stop>
        <span class="status-dot" aria-hidden="true" />
        <select
          class="status-select"
          :value="guest.status"
          @change="onChangeStatus($event.target.value)"
        >
          <option value="confirmed">{{ t("guests.confirmed") }}</option>
          <option value="pending">{{ t("guests.pending") }}</option>
          <option value="declined">{{ t("guests.declined") }}</option>
        </select>
      </div>
    </td>

    <td>{{ plusLabel }}</td>

    <td>
      <select
        class="table-select"
        :value="tableSelectValue"
        :disabled="isDeclined"
        @change="onChangeTable($event.target.value)"
        @click.stop
      >
        <option value="unassigned">{{ t("guests.unassigned") }}</option>
        <option v-for="tb in tables" :key="tb.id" :value="tb.id">
          {{ tb.name }} ({{ tb.assigned }}/{{ tb.capacity }})
        </option>
      </select>
    </td>

    <td class="dietary-cell">{{ guest.dietary || "—" }}</td>

    <td>
      <div class="actions">
        <button class="action-link" type="button" @click.stop="$emit('edit', guest)">{{ t("guests.edit") }}</button>
        <button class="action-link action-remove" type="button" @click.stop="$emit('remove', guest.id)">
          {{ t("guests.remove") }}
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  guest: { type: Object, required: true },
  tables: { type: Array, default: () => [] }
});
const emit = defineEmits(["changeTable", "changeStatus", "remove", "edit"]);

const isDeclined = computed(() => props.guest.status === "declined");

const pillClass = computed(() => {
  if (props.guest.status === "confirmed") return "pill-confirmed";
  if (props.guest.status === "pending") return "pill-pending";
  return "pill-declined";
});

const plusLabel = computed(() => {
  const p = Number(props.guest.plus || 0);
  return p > 0 ? `+${p}` : "+0";
});

const tableSelectValue = computed(() => props.guest.tableId || "unassigned");

// Initials from full name — first letter of up to two words.
const initials = computed(() => {
  const name = (props.guest.name || '').trim();
  if (!name) return '?';
  const parts = name.split(/\s+/);
  return parts.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('') || '?';
});

// Deterministic avatar background so the same guest always gets the same colour.
const AVATAR_PALETTE = [
  '#5a7a52', '#7a6a9e', '#4E8262', '#b06060', '#7a9db8', '#a06a4b', '#8a7043',
];
const avatarColor = computed(() => {
  const key = String(props.guest.id || props.guest.name || '');
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
});

function onChangeTable(value) {
  emit("changeTable", { guestId: props.guest.id, tableId: value === "unassigned" ? null : value });
}

function onChangeStatus(value) {
  emit("changeStatus", { guestId: props.guest.id, status: value });
}
</script>

<style scoped>
.row-declined {
  opacity: 0.55;
}

.g-name-cell {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.g-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

.g-name-block { min-width: 0; }

.guest-name {
  font-weight: 600;
  font-size: 13.5px;
  color: var(--dash-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.guest-email {
  font-size: 12px;
  color: var(--dash-light);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Status wrapper — dot + select together, so the dot's colour tracks the status
   without the OS-native select painting over it. Matches the proposal:
   "точка во боја + текст, скенирливо во листа од 70". */
.status-wrap {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-select {
  border: none;
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: pointer;
  padding: 0;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 4px;
}

.pill-confirmed { background: var(--dash-sage-ghost); color: var(--dash-sage); }
.pill-confirmed .status-dot { background: var(--dash-sage); }

.pill-pending { background: var(--dash-gold-pale); color: #8a6a30; }
.pill-pending .status-dot { background: #b8954e; }

.pill-declined { background: var(--dash-blush-pale); color: #9a5e56; }
.pill-declined .status-dot { background: var(--dash-blush); }

/* Table select */
.table-select {
  padding: 7px 12px;
  border: 1.5px solid var(--dash-cream-border);
  border-radius: 9px;
  font-size: 12.5px;
  font-family: var(--font-ui);
  color: var(--dash-ink);
  background: var(--dash-cream);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  max-width: 170px;
}

.table-select:focus {
  border-color: var(--dash-sage-light);
  box-shadow: 0 0 0 3px rgba(90, 122, 82, 0.1);
  background: var(--dash-cream-card);
}

.table-select:disabled {
  background: var(--dash-cream);
  color: var(--dash-light);
  cursor: not-allowed;
}

.dietary-cell {
  font-size: 12px;
  color: var(--dash-light);
}

/* Text-only action buttons */
.actions { display: flex; gap: 12px; }

.action-link {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--dash-sage);
  transition: color 0.15s ease;
}

.action-link:hover { color: var(--dash-sage-dark); }

.action-remove { color: var(--dash-blush); }
.action-remove:hover { color: #9a5e56; }

.clickable-row { cursor: pointer; }
</style>
