<template>
  <BaseModal :open="open" :title="isEdit ? t('agenda.editDialog.title') : t('agenda.addDialog.title')" @close="emit('close')">
    <form class="form" @submit.prevent="submit">
      <div class="field">
        <label>{{ t("agenda.form.title") }} *</label>
        <input class="input" v-model="draft.title" :placeholder="t('agenda.addDialog.titlePh')" />
        <div v-if="errors.title" class="err">{{ errors.title }}</div>
      </div>

      <div class="two">
        <div class="field">
          <label>{{ t("agenda.form.type") }} *</label>
          <select class="input" v-model="draft.type">
            <option v-for="(val, key) in AgendaType" :key="key" :value="val">
              {{ t(`agenda.types.${val}`) }}
            </option>
          </select>
          <div v-if="errors.type" class="err">{{ errors.type }}</div>
        </div>
        <div class="field">
          <label>{{ t("agenda.form.visibility") }}</label>
          <select class="input" v-model="draft.visibility">
            <option v-for="(val, key) in AgendaVisibility" :key="key" :value="val">
              {{ t(`agenda.visibility.${val}`) }}
            </option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>{{ t("agenda.form.dateTime") }} *</label>
        <input class="input" v-model="draft.dateTime" type="datetime-local" />
        <div v-if="errors.dateTime" class="err">{{ errors.dateTime }}</div>
      </div>

      <div class="field">
        <label>{{ t("agenda.form.description") }}</label>
        <textarea
          class="input textarea"
          v-model="draft.description"
          :placeholder="t('agenda.addDialog.descriptionPh')"
          rows="3"
        />
      </div>

      <AuthLocationInput
        v-model="draft.location"
        :label="t('agenda.form.location')"
        :placeholder="t('agenda.addDialog.locationPh')"
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

      <div v-if="validationError" class="err-box">{{ validationError }}</div>
    </form>

    <template #footer>
      <ButtonMain v-if="isEdit" variant="danger" type="button" @click="emit('delete', item.id)">
        {{ t("common.delete") }}
      </ButtonMain>

      <div class="footer-right">
        <ButtonMain variant="outline" type="button" @click="emit('close')">
          {{ t("common.cancel") }}
        </ButtonMain>
        <ButtonMain variant="main" type="button" @click="submit">
          {{ isEdit ? t("common.save") : t("agenda.addDialog.create") }}
        </ButtonMain>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import AuthLocationInput from "@/components/auth/AuthLocationInput.vue";
import { AgendaType } from "@/enums/AgendaType";
import { AgendaVisibility } from "@/enums/AgendaVisibility";

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  item: { type: Object, default: null }
});

const emit = defineEmits(["close", "submit", "delete"]);

const isEdit = computed(() => !!props.item?.id);

const draft = reactive({
  title: "",
  type: AgendaType.CEREMONY,
  visibility: AgendaVisibility.EVERYONE,
  dateTime: "",
  description: "",
  location: { name: "", address: "", lat: null, lng: null, placeId: null },
});

const errors = reactive({ title: "", type: "", dateTime: "" });
const validationError = ref("");

watch(
  () => props.open,
  (v) => {
    if (!v) return;

    validationError.value = "";
    errors.title = "";
    errors.type = "";
    errors.dateTime = "";

    if (props.item) {
      draft.title = props.item.title ?? "";
      draft.type = props.item.type ?? AgendaType.CEREMONY;
      draft.visibility = props.item.visibility ?? AgendaVisibility.EVERYONE;
      draft.dateTime = toLocalInput(props.item.dateTime);
      draft.description = props.item.description ?? "";

      const loc = props.item.location ?? {};
      draft.location = {
        name: loc.name ?? "",
        address: loc.addressLine ?? "",
        lat: loc.latitude ?? null,
        lng: loc.longitude ?? null,
        placeId: loc.placeId ?? null,
      };
    } else {
      draft.title = "";
      draft.type = AgendaType.CEREMONY;
      draft.visibility = AgendaVisibility.EVERYONE;
      draft.dateTime = "";
      draft.description = "";
      draft.location = { name: "", address: "", lat: null, lng: null, placeId: null };
    }
  }
);

/**
 * Convert an ISO / OffsetDateTime string from BE to the value
 * expected by <input type="datetime-local"> ("YYYY-MM-DDTHH:mm").
 */
function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Convert the "YYYY-MM-DDTHH:mm" value from <input type="datetime-local">
 * to an ISO-8601 string with the local UTC offset (OffsetDateTime-compatible).
 */
function toOffsetDateTime(local) {
  if (!local) return null;
  const d = new Date(local);
  if (isNaN(d)) return null;
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const pad = (n) => String(Math.abs(n)).padStart(2, "0");
  return `${local}:00${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;
}

function validate() {
  validationError.value = "";
  errors.title = draft.title.trim() ? "" : t("agenda.errors.titleRequired");
  errors.type = draft.type ? "" : t("agenda.errors.typeRequired");
  errors.dateTime = draft.dateTime ? "" : t("agenda.errors.dateTimeRequired");

  return !(errors.title || errors.type || errors.dateTime);
}

function submit() {
  if (!validate()) return;

  const loc = draft.location || {};
  const hasLocation = loc.name || loc.address || loc.lat != null;

  const payload = {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    type: draft.type,
    visibility: draft.visibility,
    dateTime: toOffsetDateTime(draft.dateTime),
    location: hasLocation ? {
      name: loc.name || null,
      addressLine: loc.address || null,
      latitude: loc.lat,
      longitude: loc.lng,
      isActive: true,
    } : null,
  };

  if (isEdit.value) {
    payload.id = props.item.id;
  }

  emit("submit", payload);
}
</script>

<style scoped>
.form {
  display: grid;
  gap: 14px;
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
  background: var(--bg-main);
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

.textarea {
  resize: vertical;
  font-family: inherit;
  min-height: 72px;
}

.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.err {
  margin-top: 6px;
  font-size: 12px;
  color: var(--error);
  font-weight: 600;
}

.err-box {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #ffd2d2;
  background: #fff5f5;
  color: #b00020;
  font-weight: 600;
  font-size: 13px;
}

.footer-right {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

@media (max-width: 600px) {
  .two {
    grid-template-columns: 1fr;
  }
}
</style>
