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

      <div class="two">
        <div class="field">
          <label>{{ t("agenda.form.startTime") }} *</label>
          <div class="time-selects">
            <select class="input" v-model="draft.hour">
              <option v-for="h in 24" :key="h-1" :value="String(h-1).padStart(2,'0')">
                {{ String(h-1).padStart(2,'0') }}
              </option>
            </select>
            <span class="time-sep">:</span>
            <select class="input" v-model="draft.minute">
              <option v-for="m in [0,5,10,15,20,25,30,35,40,45,50,55]" :key="m" :value="String(m).padStart(2,'0')">
                {{ String(m).padStart(2,'0') }}
              </option>
            </select>
          </div>
          <div v-if="errors.time" class="err">{{ errors.time }}</div>
        </div>
        <div class="field">
          <label>{{ t("agenda.form.endTime") }}</label>
          <div class="time-selects">
            <select class="input" v-model="draft.endHour">
              <option value="">--</option>
              <option v-for="h in 24" :key="h-1" :value="String(h-1).padStart(2,'0')">
                {{ String(h-1).padStart(2,'0') }}
              </option>
            </select>
            <span class="time-sep">:</span>
            <select class="input" v-model="draft.endMinute">
              <option value="">--</option>
              <option v-for="m in [0,5,10,15,20,25,30,35,40,45,50,55]" :key="m" :value="String(m).padStart(2,'0')">
                {{ String(m).padStart(2,'0') }}
              </option>
            </select>
          </div>
          <div v-if="errors.endTime" class="err">{{ errors.endTime }}</div>
        </div>
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
  hour: "00",
  minute: "00",
  endHour: "",
  endMinute: "",
  description: "",
  location: { name: "", address: "", lat: null, lng: null, placeId: null },
});

const errors = reactive({ title: "", type: "", time: "", endTime: "" });
const validationError = ref("");

watch(
  () => props.open,
  (v) => {
    if (!v) return;

    validationError.value = "";
    errors.title = "";
    errors.type = "";
    errors.time = "";
    errors.endTime = "";

    if (props.item) {
      draft.title = props.item.title ?? "";
      draft.type = props.item.type ?? AgendaType.CEREMONY;
      draft.visibility = props.item.visibility ?? AgendaVisibility.EVERYONE;

      if (props.item.startTime) {
        const [sh, sm] = props.item.startTime.split(":");
        draft.hour = (sh ?? "00").padStart(2, "0");
        draft.minute = (sm ?? "00").padStart(2, "0");
      } else {
        const { hour, minute } = splitDateTime(props.item.dateTime);
        draft.hour = hour;
        draft.minute = minute;
      }

      if (props.item.endTime) {
        const [eh, em] = props.item.endTime.split(":");
        draft.endHour = (eh ?? "").padStart(2, "0");
        draft.endMinute = (em ?? "").padStart(2, "0");
      } else {
        draft.endHour = "";
        draft.endMinute = "";
      }

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
      draft.hour = "00";
      draft.minute = "00";
      draft.endHour = "";
      draft.endMinute = "";
      draft.description = "";
      draft.location = { name: "", address: "", lat: null, lng: null, placeId: null };
    }
  }
);

/**
 * Split an ISO / OffsetDateTime string into hour, minute.
 * Parses the string directly to avoid timezone conversion.
 */
function splitDateTime(iso) {
  if (!iso) return { hour: "00", minute: "00" };
  const match = String(iso).match(/T(\d{2}):(\d{2})/);
  if (match) return { hour: match[1], minute: match[2] };
  return { hour: "00", minute: "00" };
}

function validate() {
  validationError.value = "";
  errors.title = draft.title.trim() ? "" : "Title is required";
  errors.type = draft.type ? "" : "Type is required";
  errors.time = "";
  errors.endTime = "";

  // If one of endHour/endMinute is set, both must be set
  const hasEndHour = draft.endHour !== "";
  const hasEndMinute = draft.endMinute !== "";
  if (hasEndHour !== hasEndMinute) {
    errors.endTime = "Select both hour and minute";
  }

  // End time must be after start time
  if (hasEndHour && hasEndMinute) {
    const start = Number(draft.hour) * 60 + Number(draft.minute);
    const end = Number(draft.endHour) * 60 + Number(draft.endMinute);
    if (end <= start) {
      errors.endTime = "End time must be after start time";
    }
  }

  return !(errors.title || errors.type || errors.time || errors.endTime);
}

function submit() {
  if (!validate()) return;

  const loc = draft.location || {};
  const hasLocation = loc.name || loc.address || loc.lat != null;

  const hasEnd = draft.endHour !== "" && draft.endMinute !== "";

  const payload = {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    type: draft.type,
    visibility: draft.visibility,
    isPublic: draft.visibility === AgendaVisibility.EVERYONE,
    startTime: `${draft.hour}:${draft.minute}`,
    endTime: hasEnd ? `${draft.endHour}:${draft.endMinute}` : null,
    displayOrder: null,
    location: hasLocation ? {
      name: loc.name || null,
      type: "VENUE",
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
